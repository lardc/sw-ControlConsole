using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO.Ports;
using System.Linq;
using System.Threading;
using PE.SCCI.Properties;

namespace PE.SCCI.Master
{
    public class SCCIMasterAdapter : IDisposable
    {
        #region Constants

        private const int BUFFER_SIZE = 65000;
        private const int FRAME_MAX_SIZE = 256;
        private const ushort FRAME_START = 0xDB00;
        private const byte FRAME_START_BYTE = 0xDB;
        private const int DATA_STREAM_QUANTA = 8;

        private const byte FUNCTION_CODE_MASK = 0x78;
        private const byte FUNCTION_SCODE_MASK = 0x07;
        private const byte FUNCTION_RR_MASK = 0x80;

        private const bool IGNORE_TIMEOUTS = false; 

        #endregion

        #region Fields

        private readonly object m_ReadSync = new object(), m_OperationSync = new object();
        private readonly AutoResetEvent m_DataReceivedEvent = new AutoResetEvent(false);
        private readonly ushort[] m_ReadBuffer;
        private readonly ushort[] m_WriteBuffer;
        private readonly byte[] m_RawReadBuffer;
        private readonly byte[] m_RawWriteBuffer;
        private readonly bool m_UseStreaming;
        private SerialPort m_Port;
        private int m_TimeoutSync, m_TimeoutSyncStream, m_RetransmitsOnErrCount, m_RetransmitsOnErrCountForArrays;
        private bool m_CatchTimeouts;
        private volatile int m_RawReadBufferLength;

        #endregion

        #region Tables

        private readonly int[,] m_Lengths = new [,] {
                                                        {-1, -1, -1, -1, -1, -1},
                                                        {-1,  4,  4,  5, -1,  4},
                                                        {-1,  5,  6,  7, -1,  6},
                                                        {-1,  4, -1, -1, -1, -1},
                                                        {-1,  8,  8,  8,  8, -1},
                                                        { 4, -1, -1, -1, -1, -1},
                                                        { 5, -1, -1, -1, -1, -1},
                                                        {-1,  6, -1,  6, -1, -1}
                                                    };


        #endregion

        /// <summary>
        /// Default constructor
        /// </summary>
        /// <param name="UseStreaming">Enable streaming data transfers</param>
        public SCCIMasterAdapter(bool UseStreaming)
        {
            m_UseStreaming = UseStreaming;
            
            if (UseStreaming)
            {
                m_ReadBuffer = new ushort[BUFFER_SIZE];
                m_WriteBuffer = new ushort[BUFFER_SIZE];
                m_RawReadBuffer = new byte[BUFFER_SIZE * 2];
                m_RawWriteBuffer = new byte[BUFFER_SIZE * 2];
            }
            else
            {
                m_ReadBuffer = new ushort[FRAME_MAX_SIZE];
                m_WriteBuffer = new ushort[FRAME_MAX_SIZE];
                m_RawReadBuffer = new byte[FRAME_MAX_SIZE * 2];
                m_RawWriteBuffer = new byte[FRAME_MAX_SIZE * 2];
            }
        }

        /// <summary>
        /// Indicates connection state
        /// </summary>
        public bool Connected
        {
            get
            {
                try
                {
                    return (m_Port != null) && m_Port.IsOpen;
                }
                catch (Exception)
                {
                    return false;
                }
            }
        }

        /// <summary>
        /// Initialize connection
        /// </summary>
        /// <param name="PortConfguration">Configuration of serial port</param>
        public void Initialize(SerialPortConfigurationMaster PortConfguration)
        {
            // Save parameters
            m_TimeoutSync = PortConfguration.TimeoutForSyncReceive;
            m_TimeoutSyncStream = PortConfguration.TimeoutForSyncStreamReceive;
            m_RetransmitsOnErrCount = (PortConfguration.RetransmitsCountOnError > 0)
                                          ? PortConfguration.RetransmitsCountOnError
                                          : 0;
            m_RetransmitsOnErrCountForArrays = (PortConfguration.UseRetransmitsForArrays)
                                                   ? m_RetransmitsOnErrCount
                                                   : 0;
            m_CatchTimeouts = PortConfguration.RetransmitOnTimeout;
            
            // Open port
            OpenConnection(PortConfguration);
        }

        /// <summary>
        /// Close connection
        /// </summary>
        public void Close()
        {
            try
            {
                // Close port if needed
                if ((m_Port != null) && m_Port.IsOpen)
                {
                    m_Port.Close();
                    m_Port = null;

                    lock (m_ReadSync)
                        m_RawReadBufferLength = 0;
                }
            }
            catch (Exception e)
            {
                throw new SerialConnectionException(String.Format(Resources.SCCIMasterAdapter_Communication_exception, e.Message), e);
            }
        }

        /// <summary>
        /// Write 16-bit value at specified address
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Address">Address in object dictionary</param>
        /// <param name="Value">Data to write</param>
        public void Write16(ushort NodeID, ushort Address, ushort Value)
        {
            lock (m_OperationSync)
            {
                m_WriteBuffer[2] = Address;
                m_WriteBuffer[3] = Value;

                ImplementWRX(NodeID, SCCIFunctions.Write, SCCISubFunctions.Sfunc16, 2);
            }
        }

        /// <summary>
        /// Write 16-bit signed value at specified address
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Address">Address in object dictionary</param>
        /// <param name="Value">Data to write</param>
        public void Write16S(ushort NodeID, ushort Address, short Value)
        {
            Write16(NodeID, Address, (ushort)Value);
        }

        /// <summary>
        /// Write two 16-bit values at specified addresses
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Address1">Address in object dictionary</param>
        /// <param name="Value1">Data to write</param>
        /// <param name="Address2">Address in object dictionary</param>
        /// <param name="Value2">Data to write</param>
        public void Write16(ushort NodeID, ushort Address1, ushort Value1, ushort Address2, ushort Value2)
        {
            lock (m_OperationSync)
            {
                m_WriteBuffer[2] = Address1;
                m_WriteBuffer[3] = Value1;
                m_WriteBuffer[4] = Address2;
                m_WriteBuffer[5] = Value2;

                ImplementWRX(NodeID, SCCIFunctions.Write, SCCISubFunctions.Sfunc16Double, 4);
            }
        }

        /// <summary>
        /// Write two 16-bit signed values at specified addresses
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Address1">Address in object dictionary</param>
        /// <param name="Value1">Data to write</param>
        /// <param name="Address2">Address in object dictionary</param>
        /// <param name="Value2">Data to write</param>
        public void Write16S(ushort NodeID, ushort Address1, short Value1, ushort Address2, short Value2)
        {
            Write16(NodeID, Address1, (ushort)Value1, Address2, (ushort)Value2);
        }

        /// <summary>
        /// Write 32-bit value at specified address
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Address">Address in object dictionary</param>
        /// <param name="Value">Data to write</param>
        public void Write32(ushort NodeID, ushort Address, uint Value)
        {
            lock (m_OperationSync)
            {
                m_WriteBuffer[2] = Address;
                m_WriteBuffer[3] = (ushort) (Value >> 16);
                m_WriteBuffer[4] = (ushort) (Value & 0x0000FFFF);

                ImplementWRX(NodeID, SCCIFunctions.Write, SCCISubFunctions.Sfunc32, 3);
            }
        }

        /// <summary>
        /// Write 32-bit signed value at specified address
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Address">Address in object dictionary</param>
        /// <param name="Value">Data to write</param>
        public void Write32S(ushort NodeID, ushort Address, int Value)
        {
            lock (m_OperationSync)
            {
                m_WriteBuffer[2] = Address;
                m_WriteBuffer[3] = (ushort)(((uint)Value) >> 16);
                m_WriteBuffer[4] = (ushort)(((uint)Value) & 0x0000FFFF);

                ImplementWRX(NodeID, SCCIFunctions.Write, SCCISubFunctions.Sfunc32, 3);
            }
        }

        /// <summary>
        /// Write float value at specified address
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Address">Address in object dictionary</param>
        /// <param name="Value">Data to write</param>
        public void WriteFloat(ushort NodeID, ushort Address, float Value)
        {
            lock (m_OperationSync)
            {
                byte[] byteArray = BitConverter.GetBytes(Value);
                m_WriteBuffer[2] = Address;
                m_WriteBuffer[3] = (ushort)((ushort)byteArray[3] << 8 | byteArray[2]);
                m_WriteBuffer[4] = (ushort)((ushort)byteArray[1] << 8 | byteArray[0]);

                ImplementWRX(NodeID, SCCIFunctions.Write, SCCISubFunctions.SFuncFloat, 3);
            }
        }

        /// <summary>
        /// Read 16-bit value from specified address
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Address">Address in object dictionary</param>
        /// <returns>Read data</returns>
        public ushort Read16(ushort NodeID, ushort Address)
        {
            lock (m_OperationSync)
            {
                m_WriteBuffer[2] = Address;

                ImplementWRX(NodeID, SCCIFunctions.Read, SCCISubFunctions.Sfunc16, 1);

                return m_ReadBuffer[3];
            }
        }

        /// <summary>
        /// Read 16-bit signed value from specified address
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Address">Address in object dictionary</param>
        /// <returns>Read data</returns>
        public short Read16S(ushort NodeID, ushort Address)
        {
            return (short) Read16(NodeID, Address);
        }

        /// <summary>
        /// Read two 16-bit values from specified addresses
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Address1">Address in object dictionary</param>
        /// <param name="Address2">Address in object dictionary</param>
        /// <returns>Read pair of data</returns>
        public ushort[] Read16(ushort NodeID, ushort Address1, ushort Address2)
        {
            lock (m_OperationSync)
            {
                m_WriteBuffer[2] = Address1;
                m_WriteBuffer[3] = Address2;

                ImplementWRX(NodeID, SCCIFunctions.Read, SCCISubFunctions.Sfunc16Double, 2);

                return new []{m_ReadBuffer[3], m_ReadBuffer[5]};
            }
        }

        /// <summary>
        /// Read two 16-bit signed values from specified addresses
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Address1">Address in object dictionary</param>
        /// <param name="Address2">Address in object dictionary</param>
        /// <returns>Read pair of data</returns>
        public short[] Read16S(ushort NodeID, ushort Address1, ushort Address2)
        {
            return Read16(NodeID, Address1, Address2).Select(X => (short) X).ToArray();
        }

        /// <summary>
        /// Read 32-bit value from specified address
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Address">Address in object dictionary</param>
        /// <returns>Read data</returns>
        public uint Read32(ushort NodeID, ushort Address)
        {
            lock (m_OperationSync)
            {
                m_WriteBuffer[2] = Address;

                ImplementWRX(NodeID, SCCIFunctions.Read, SCCISubFunctions.Sfunc32, 1);

                return ((uint)m_ReadBuffer[3] << 16) | m_ReadBuffer[4];
            }
        }

        /// <summary>
        /// Read 32-bit signed value from specified address
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Address">Address in object dictionary</param>
        /// <returns>Read data</returns>
        public int Read32S(ushort NodeID, ushort Address)
        {
            lock (m_OperationSync)
            {
                m_WriteBuffer[2] = Address;

                ImplementWRX(NodeID, SCCIFunctions.Read, SCCISubFunctions.Sfunc32, 1);

                return ((m_ReadBuffer[3]) << 16) | m_ReadBuffer[4];
            }
        }

        /// <summary>
        /// Read float value from specified address
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Address">Address in object dictionary</param>
        /// <returns>Read data</returns>
        public float ReadFloat(ushort NodeID, ushort Address)
        {
            lock (m_OperationSync)
            {
                m_WriteBuffer[2] = Address;

                ImplementWRX(NodeID, SCCIFunctions.Read, SCCISubFunctions.SFuncFloat, 1);
                
                byte[] byteArray = new byte[4];
                byteArray[0] = (byte)(m_ReadBuffer[4] & 0x00FF);
                byteArray[1] = (byte)(m_ReadBuffer[4] >> 8);
                byteArray[2] = (byte)(m_ReadBuffer[3] & 0x00FF);
                byteArray[3] = (byte)(m_ReadBuffer[3] >> 8);

                return BitConverter.ToSingle(byteArray, 0);
            }
        }

        /// <summary>
        /// Read array of 16-bit values from specified endpoint
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Endpoint">Data source</param>
        /// <param name="MaxCount">Max number of values to receive</param>
        /// <returns>Array of data</returns>
        public IList<ushort> ReadArray16(ushort NodeID, ushort Endpoint, int MaxCount)
        {
            lock (m_OperationSync)
            {
                var result = new List<ushort>();
                var i = 0;
                var dataCount = 1;

                while ((i < MaxCount) && (dataCount > 0))
                {
                    m_WriteBuffer[2] = (ushort)(Endpoint << 8);

                    ImplementRAX(NodeID, SCCIFunctions.ReadBlock, SCCISubFunctions.Sfunc16, SCCISubFunctions.SFuncRep16, 1);
                    
                    dataCount = m_ReadBuffer[2] & 0x00FF;
                    i += dataCount;

                    if (i > MaxCount)
                        dataCount = i - MaxCount;

                    for (var j = 0; j < dataCount; j++)
                        result.Add(m_ReadBuffer[3 + j]);
                }

                return result;
            }
        }

        /// <summary>
        /// Read array of 16-bit signed values from specified endpoint
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Endpoint">Data source</param>
        /// <param name="MaxCount">Max number of values to receive</param>
        /// <returns>Array of data</returns>
        public IList<short> ReadArray16S(ushort NodeID, ushort Endpoint, int MaxCount)
        {
            return ReadArray16(NodeID, Endpoint, MaxCount).Select(X => (short)X).ToArray();
        }

        /// <summary>
        /// Read array of 32-bit values from specified endpoint
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Endpoint">Data source</param>
        /// <param name="MaxCount">Max number of values to receive</param>
        /// <returns>Array of data</returns>
        public IList<uint> ReadArray32(ushort NodeID, ushort Endpoint, int MaxCount)
        {
            lock (m_OperationSync)
            {
                var result = new List<uint>();
                var i = 0;
                var dataCount = 1;

                while ((i < MaxCount) && (dataCount > 0))
                {
                    m_WriteBuffer[2] = (ushort)(Endpoint << 8);

                    ImplementRAX(NodeID, SCCIFunctions.ReadBlock, SCCISubFunctions.Sfunc32, SCCISubFunctions.SFuncRep32, 1);

                    dataCount = m_ReadBuffer[2] & 0x00FF;
                    i += dataCount;

                    if (i > MaxCount)
                        dataCount = i - MaxCount;

                    for (var j = 0; j < dataCount; j++)
                        result.Add((((uint) m_ReadBuffer[3 + j * 2 + 1]) << 16) | m_ReadBuffer[3 + j * 2]);
                }

                return result;
            }
        }

        /// <summary>
        /// Read array of 32-bit signed values from specified endpoint
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Endpoint">Data source</param>
        /// <param name="MaxCount">Max number of values to receive</param>
        /// <returns>Array of data</returns>
        public IList<int> ReadArray32S(ushort NodeID, ushort Endpoint, int MaxCount)
        {
            return ReadArray32(NodeID, Endpoint, MaxCount).Select(X => (int)X).ToArray();
        }

        /// <summary>
        /// Write array of 16-bit values to specified endpoint
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Endpoint">Data destination</param>
        /// <param name="Data">Array of data</param>
        public void WriteArray16(ushort NodeID, ushort Endpoint, IList<ushort> Data)
        {
            const int maxSize = 3;
            
            lock (m_OperationSync)
            {
                var i = Data.Count;

                while (i > 0)
                {
                    var dataCount = (i <= maxSize) ? i : maxSize;

                    m_WriteBuffer[2] = (ushort) ((Endpoint << 8) | dataCount);
                    for (var j = 0; j < maxSize; j++)
                        m_WriteBuffer[3 + j] =  (j < dataCount) ? Data[Data.Count - i + j] : (ushort)0;

                    ImplementWAX(NodeID, SCCIFunctions.WriteBlock, SCCISubFunctions.Sfunc16, maxSize + 1);
                    
                    i -= dataCount;
                }
            }
        }

        /// <summary>
        /// Write array of 16-bit signed values to specified endpoint
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Endpoint">Data destination</param>
        /// <param name="Data">Array of data</param>
        public void WriteArray16S(ushort NodeID, ushort Endpoint, IList<short> Data)
        {
            WriteArray16(NodeID, Endpoint, Data.Select(X => (ushort)X).ToArray());
        }

        /// <summary>
        /// Call specified device function
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Action">Function ID</param>
        public void Call(ushort NodeID, ushort Action)
        {
            lock (m_OperationSync)
            {
                m_WriteBuffer[2] = Action;

                ImplementWRX(NodeID, SCCIFunctions.Call, SCCISubFunctions.None, 1);
            }
        }

        /// <summary>
        /// Read array of 16-bit values in streaming mode
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Endpoint">Data source</param>
        /// <returns>Array of data</returns>
        public IList<ushort> ReadArrayFast16(ushort NodeID, ushort Endpoint)
        {
            if (!m_UseStreaming)
                throw new InvalidOperationException(Resources.SCCIMasterAdapter_Streaming_mode_hasnt_been_enabled);

            var result = new List<ushort>();

            lock (m_OperationSync)
            {
                var repCount = m_RetransmitsOnErrCountForArrays + 1;
                ushort dataCount = 0;
                Exception savedEx = null;

                m_WriteBuffer[2] = (ushort)(Endpoint << 8);

                while (repCount-- > 0)
                {
                    try
                    {
                        int sourceOffset;

                        ResetReceiveBuffer();
                        SendPacket(NodeID, SCCIFunctions.ReadFast, SCCISubFunctions.Sfunc16, 1);
                        var headerPacketLength = ReceivePacket(NodeID, SCCIFunctions.ReadFast, SCCISubFunctions.Sfunc16,
                            out sourceOffset, true);

                        dataCount = m_ReadBuffer[3];
                        var useCRC = ((m_ReadBuffer[2] & 0x00FF) != 0);
                        var crc = m_ReadBuffer[4];

                        ReceiveDataStream(dataCount, useCRC, crc, headerPacketLength*2 + sourceOffset);
                        m_RawReadBufferLength -= headerPacketLength*2 + sourceOffset;

                        break;
                    }
                    catch (ProtocolInvaidPacketFormatException e)
                    {
                        savedEx = e;
                    }
                    catch (ProtocolInvaidFunctionException e)
                    {
                        savedEx = e;
                    }
                    catch (ProtocolErrorFrameInvalidHeaderException e)
                    {
                        savedEx = e;
                    }
                    catch (ProtocolErrorFrameInvalidCRCException e)
                    {
                        savedEx = e;
                    }
                    catch (ProtocolBadCRCException e)
                    {
                        savedEx = e;
                    }
                    catch (ProtocolTimeoutException e)
                    {
                        if (m_CatchTimeouts)
                            savedEx = e;
                        else
                            throw;
                    }
                }

                if (repCount == 0 && savedEx != null)
                    throw savedEx;

                for (var j = 0; j < dataCount; j++)
                    result.Add(m_ReadBuffer[j]);
            }

            return result;
        }

        /// <summary>
        /// Read array of 16-bit signed values in streaming mode
        /// </summary>
        /// <param name="NodeID">ID of node in network</param>
        /// <param name="Endpoint">Data source</param>
        /// <returns>Array of data</returns>
        public IList<short> ReadArrayFast16S(ushort NodeID, ushort Endpoint)
        {
            return ReadArrayFast16(NodeID, Endpoint).Select(Arg => (short)Arg).ToArray();
        }

        /// <summary>
        /// Write string to serial port and read reply
        /// </summary>
        /// <param name="Buffer">Output string</param>
        /// <param name="WithReply">Indicates if reply required</param>
        /// <returns>Array of data</returns>
        public IList<object> SendString(string OutString, bool WithReply)
        {
            lock (m_OperationSync)
            {
                try
                {
                    var result = new List<object>();
                    char[] CharArray = (OutString + Environment.NewLine).ToCharArray();

                    if (WithReply)
                        ResetReceiveBuffer();

                    // Send string
                    m_Port.Write(CharArray, 0, CharArray.Length);

                    // Receive reply
                    if (WithReply)
                    {
                        bool received = false;
                        var RawReadBufferPrevLength = 0;
                        var timeout_copy = Environment.TickCount;
                        var timeout = Environment.TickCount + m_TimeoutSyncStream;

                        while (Environment.TickCount < timeout || IGNORE_TIMEOUTS)
                        {
                            lock (m_ReadSync)
                            {
                                if (RawReadBufferPrevLength == m_RawReadBufferLength && m_RawReadBufferLength > 0)
                                {
                                    for (int i = 0; i < m_RawReadBufferLength; i++)
                                        result.Add((char)m_RawReadBuffer[i]);

                                    m_RawReadBufferLength = 0;
                                    received = true;

                                    if (0x0A == (char)(result[result.Count - 1]))
                                        break;
                                }

                                RawReadBufferPrevLength = m_RawReadBufferLength;
                            }

                            Thread.Sleep(20);
                        }

                        if (!received)
                            throw new ProtocolTimeoutException(Resources.SCCIMasterAdapter_Communication_exception);
                    }

                    return result;
                }
                catch (TimeoutException)
                {
                    throw new SerialConnectionTimeoutException(Resources.SCCIMasterAdapter_Communication_exception_hardware_timeout);
                }
                catch (Exception e)
                {
                    throw new SerialConnectionException(String.Format(Resources.SCCIMasterAdapter_Communication_exception, e.Message), e);
                }
            }
        }

        #region Private members

        private void OpenConnection(SerialPortConfigurationMaster PortConfguration)
        {
            m_Port = new SerialPort(@"COM" + PortConfguration.PortNumber, PortConfguration.BaudRate,
                                    PortConfguration.ParityMode, PortConfguration.DataBits,
                                    PortConfguration.StopBits) { ReceivedBytesThreshold = 1 };

            m_Port.DataReceived += PortDataReceived;

            try
            {
                m_Port.Open();
            }
            catch (Exception e)
            {
                throw new SerialConnectionException(string.Format(Resources.SCCIMasterAdapter_Communication_exception, e.Message), e);
            }
        }

        private void ResetReceiveBuffer()
        {
            lock (m_ReadSync)
                m_RawReadBufferLength = 0;
        }

        private void ImplementWRX(ushort NodeID, SCCIFunctions Function, SCCISubFunctions SubFunction, int UserDataLength)
        {
            var repCount = m_RetransmitsOnErrCount + 1;
            Exception savedEx = null;

            while (repCount-- > 0)
            {
                try
                {
                    savedEx = null;
                    int sourceOffset;

                    ResetReceiveBuffer();
                    SendPacket(NodeID, Function, SubFunction, UserDataLength);
                    ReceivePacket(NodeID, Function, SubFunction, out sourceOffset);

                    break;
                }
                catch (ProtocolInvaidPacketFormatException e)
                {
                    savedEx = e;
                }
                catch (ProtocolInvaidFunctionException e)
                {
                    savedEx = e;
                }
                catch (ProtocolErrorFrameInvalidHeaderException e)
                {
                    savedEx = e;
                }
                catch (ProtocolErrorFrameInvalidCRCException e)
                {
                    savedEx = e;
                }
                catch (ProtocolBadCRCException e)
                {
                    savedEx = e;
                }
                catch (ProtocolTimeoutException e)
                {
                    if (m_CatchTimeouts)
                        savedEx = e;
                    else
                        throw;
                }
            }

            if (savedEx != null)
                throw savedEx;
        }

        private void ImplementWAX(ushort NodeID, SCCIFunctions Function, SCCISubFunctions SubFunction, int UserDataLength)
        {
            var repCount = m_RetransmitsOnErrCount + 1;
            Exception savedEx = null;

            while (repCount-- > 0)
            {
                try
                {
                    savedEx = null;
                    int sourceOffset;

                    ResetReceiveBuffer();
                    SendPacket(NodeID, Function, SubFunction, UserDataLength);
                    ReceivePacket(NodeID, Function, SubFunction, out sourceOffset);

                    break;
                }
                catch (ProtocolInvaidPacketFormatException e)
                {
                    savedEx = e;
                }
                catch (ProtocolInvaidFunctionException e)
                {
                    savedEx = e;
                }
                catch (ProtocolErrorFrameInvalidHeaderException e)
                {
                    savedEx = e;
                }
                catch (ProtocolErrorFrameInvalidCRCException e)
                {
                    savedEx = e;
                }
                catch (ProtocolBadCRCException e)
                {
                    savedEx = e;
                }
                catch (ProtocolTimeoutException e)
                {
                    if (m_CatchTimeouts)
                        savedEx = e;
                    else
                        throw;
                }
            }

            if (repCount == 0 && savedEx != null)
                throw savedEx;
        }

        private void ImplementRAX(ushort NodeID, SCCIFunctions Function, SCCISubFunctions SubFunction, SCCISubFunctions SubFunctionRep, int UserDataLength)
        {
            Action<Exception> errorHandler = delegate(Exception SavedException)
            {
                var repCount = m_RetransmitsOnErrCountForArrays;

                while (repCount-- > 0)
                {
                    try
                    {
                        SavedException = null;
                        int sourceOffset;

                        ResetReceiveBuffer();
                        SendPacket(NodeID, Function, SubFunctionRep, UserDataLength);
                        ReceivePacket(NodeID, Function, SubFunctionRep, out sourceOffset);

                        break;
                    }
                    catch (ProtocolInvaidPacketFormatException e)
                    {
                        SavedException = e;
                    }
                    catch (ProtocolInvaidFunctionException e)
                    {
                        SavedException = e;
                    }
                    catch (ProtocolErrorFrameInvalidHeaderException e)
                    {
                        SavedException = e;
                    }
                    catch (ProtocolErrorFrameInvalidCRCException e)
                    {
                        SavedException = e;
                    }
                    catch (ProtocolBadCRCException e)
                    {
                        SavedException = e;
                    }
                    catch (ProtocolTimeoutException e)
                    {
                        SavedException = e;
                    }
                }

                if (SavedException != null)
                    throw SavedException;
            };

            try
            {
                int sourceOffset;

                ResetReceiveBuffer();
                SendPacket(NodeID, Function, SubFunction, UserDataLength);
                ReceivePacket(NodeID, Function, SubFunction, out sourceOffset);
            }
            catch (ProtocolInvaidPacketFormatException e)
            {
                errorHandler(e);
            }
            catch (ProtocolInvaidFunctionException e)
            {
                errorHandler(e);
            }
            catch (ProtocolBadCRCException e)
            {
                errorHandler(e);
            }
            catch (ProtocolTimeoutException e)
            {
                if (m_CatchTimeouts)
                    errorHandler(e);
                else
                    throw;
            }
        }

        private void SendPacket(ushort NodeID, SCCIFunctions Function, SCCISubFunctions SubFunction, int UserDataLength)
        {
            // CRC and prefix
            UserDataLength += 3;
            
            // Fill prefix and CRC
            m_WriteBuffer[0] = (ushort) (NodeID | FRAME_START);
            m_WriteBuffer[1] = (ushort)((((ushort)Function << 3) | (ushort)SubFunction) << 8);
            m_WriteBuffer[UserDataLength - 1] = CRC16.ComputeCRC(m_WriteBuffer, UserDataLength - 1);

            Utils.SerializeUShortArrayToBytes(m_WriteBuffer, UserDataLength, m_RawWriteBuffer);

            try
            {
                m_Port.Write(m_RawWriteBuffer, 0, UserDataLength * 2);
            }
            catch (TimeoutException)
            {
                throw new SerialConnectionTimeoutException(Resources.SCCIMasterAdapter_Communication_exception_hardware_timeout);
            }
            catch (Exception e)
            {
                throw new SerialConnectionException(String.Format(Resources.SCCIMasterAdapter_Communication_exception, e.Message), e);
            }
        }

        private int ReceivePacket(ushort NodeID, SCCIFunctions Function, SCCISubFunctions SubFunction, out int SourceOffset, bool PreserveBuffer = false)
        {
            bool error;
            var packetLength = ReceiveHeader(NodeID, Function, SubFunction, out error, out SourceOffset);

            ReceiveBody(packetLength, PreserveBuffer, SourceOffset);

            if(error)
            {
                var code = (SCCIErrors) m_ReadBuffer[2];
                var details = m_ReadBuffer[3];

                switch(code)
                {
                    case SCCIErrors.InvalidSfunction:
                    case SCCIErrors.InvalidFunction:
                        throw new ProtocolErrorFrameInvalidHeaderException(String.Format(Resources.SCCIMasterAdapter_SCCI_protocol_error, code, details), code, details);
                    case SCCIErrors.BadCRC:
                        throw new ProtocolErrorFrameInvalidCRCException(String.Format(Resources.SCCIMasterAdapter_SCCI_protocol_error, code, details), code, details);
                    default:
                        throw new ProtocolErrorFrameException(String.Format(Resources.SCCIMasterAdapter_SCCI_protocol_error, code, details), code, details);
                }
            }

            return packetLength;
        }

        private void ReceiveDataStream(int DataCount, bool UseCRC, ushort CRC, int SourceBufferOffset)
        {
            var received = false;
            var timeout = Environment.TickCount + m_TimeoutSyncStream;
            var streamLength = (DataCount / DATA_STREAM_QUANTA + ((DataCount % DATA_STREAM_QUANTA != 0) ? 1 : 0)) * DATA_STREAM_QUANTA;

            while ((Environment.TickCount < timeout) || IGNORE_TIMEOUTS)
            {
                lock (m_ReadSync)
                {
                    if (m_RawReadBufferLength >= (streamLength * 2 + SourceBufferOffset))
                    {
                        Utils.DeserializeBytesToUShortArray(m_RawReadBuffer, streamLength * 2, m_ReadBuffer, SourceBufferOffset);
                        m_RawReadBufferLength -= streamLength * 2;
                        received = true;
                        break;
                    }
                }

                var tout = timeout - Environment.TickCount;
                tout = (tout < 0) ? 0 : tout;
                m_DataReceivedEvent.WaitOne(tout);
            }

            if (received && UseCRC)
            {
                var crcComp = CRC16.ComputeCRC(m_ReadBuffer, DataCount);

                if (crcComp != CRC)
                    throw new ProtocolBadCRCException(
                        String.Format(Resources.SCCIMasterAdapter_Parser_error_bad_CRC, CRC, crcComp), CRC, crcComp);
            }

            if (!received)
                throw new ProtocolTimeoutException(Resources.SCCIMasterAdapter_General_error_timeout_while_reading_data_stream);
        }

        private int ReceiveHeader(ushort NodeID, SCCIFunctions Function, SCCISubFunctions SubFunction, out bool Error, out int SourceOffset)
        {
            Error = false;
            SourceOffset = 0;

            var packetLength = -1;
            var receivedHeader = false;
            var timeout = Environment.TickCount + m_TimeoutSync;

            while (Environment.TickCount < timeout || IGNORE_TIMEOUTS)
            {
                lock (m_ReadSync)
                {
                    if (m_RawReadBufferLength > 3)
                    {
                        if (m_RawReadBuffer[0] != FRAME_START_BYTE)
                        {
                            SourceOffset++;
                            continue;
                        }

                        Utils.DeserializeBytesToUShortArray(m_RawReadBuffer, 4, m_ReadBuffer, SourceOffset);
                        receivedHeader = true;
                    }
                }

                if (receivedHeader)
                {
                    if ((m_ReadBuffer[0] & 0xFF00) != FRAME_START)
                        throw new ProtocolInvaidPacketFormatException(String.Format(Resources.SCCIMasterAdapter_Parser_error_wrong_START_byte, m_ReadBuffer[0] >> 8));

                    var node = (ushort)(m_ReadBuffer[0] & 0x00FF);
                    var code = (ushort)(m_ReadBuffer[1] >> 8);

                    if(node != NodeID)
                        throw new ProtocolInvaidPacketFormatException(String.Format(Resources.SCCIMasterAdapter_Parser_error_wrong_node_ID, node));

                    if ((code & FUNCTION_RR_MASK) == 0)
                        throw new ProtocolInvaidPacketFormatException(Resources.SCCIMasterAdapter_Parser_error_wrong_RR_bit);

                    var fnc = (code & FUNCTION_CODE_MASK) >> 3;
                    var sfnc = (code & FUNCTION_SCODE_MASK);

                    if (fnc >= m_Lengths.GetLength(0) || sfnc >= m_Lengths.GetLength(1))
                        throw new ProtocolInvaidFunctionException(
                            String.Format(Resources.SCCIMasterAdapter_Parser_error_invalid_value_in_field, code.ToString(@"X")), code);

                    if (fnc == (int) SCCIFunctions.Error)
                        Error = true;
                    else if((fnc != (int) Function) || (sfnc != (int) SubFunction))
                        throw new ProtocolInvaidFunctionException(
                            String.Format(Resources.SCCIMasterAdapter_Response_is_not_matched_to_request, Function, SubFunction, fnc, sfnc), code);

                    packetLength = m_Lengths[fnc, sfnc];
                    Trace.Assert(packetLength != -1, String.Format(@"FNC: {0}, SFNC{1}", fnc, sfnc));

                    break;
                }

                var tout = timeout - Environment.TickCount;
                tout = (tout < 0) ? 0 : tout;
                m_DataReceivedEvent.WaitOne(tout);
            }

            if (!receivedHeader)
                throw new ProtocolTimeoutException(Resources.SCCIMasterAdapter_General_error_timeout_while_reading_frame_header);

            return packetLength;
        }

        private void ReceiveBody(int BodyLength, bool PreserveBuffer, int SourceOffset)
        {
            var receivedBody = false;
            var timeout = Environment.TickCount + m_TimeoutSync;

            while (Environment.TickCount < timeout || IGNORE_TIMEOUTS)
            {
                lock (m_ReadSync)
                {
                    if (m_RawReadBufferLength >= BodyLength * 2)
                    {
                        Utils.DeserializeBytesToUShortArray(m_RawReadBuffer, BodyLength * 2, m_ReadBuffer, SourceOffset);
                        if (!PreserveBuffer)
                            m_RawReadBufferLength -= BodyLength * 2 + SourceOffset;
                        receivedBody = true;
                    }
                }

                if (receivedBody)
                {
                    var crcComp = CRC16.ComputeCRC(m_ReadBuffer, BodyLength - 1);
                    var crcRec = m_ReadBuffer[BodyLength - 1];

                    if (crcComp != crcRec)
                        throw new ProtocolBadCRCException(String.Format(Resources.SCCIMasterAdapter_Parser_error_bad_CRC, crcRec, crcComp), crcRec, crcComp);

                    break;
                }

                m_DataReceivedEvent.WaitOne((timeout - Environment.TickCount < 0) ? 0 : timeout - Environment.TickCount);
            }

            if (!receivedBody)
                throw new ProtocolTimeoutException(Resources.SCCIMasterAdapter_General_error_timeout_while_reading_frame_body);
        }

        private void PortDataReceived(object Sender, SerialDataReceivedEventArgs E)
        {
            // Read new data
            lock (m_ReadSync)
                try
                {
                    if (m_Port.BytesToRead + m_RawReadBufferLength > (m_UseStreaming ? BUFFER_SIZE : FRAME_MAX_SIZE))
                        m_RawReadBufferLength = 0;

                    var read = m_Port.Read(m_RawReadBuffer, m_RawReadBufferLength, m_Port.BytesToRead);
                    m_RawReadBufferLength += read;

                    m_DataReceivedEvent.Set();
                }
                catch (Exception)
                {
                    m_RawReadBufferLength = 0;
                }
        }

        #endregion

        #region IDisposable Members

        public void Dispose()
        {
            // ReSharper disable EmptyGeneralCatchClause
            try
            {
                m_Port.Dispose();
            }
            catch
            {
            }
            // ReSharper restore EmptyGeneralCatchClause
        }

        #endregion
    }
}
