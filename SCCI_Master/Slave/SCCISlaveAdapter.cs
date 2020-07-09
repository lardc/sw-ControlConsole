using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO.Ports;
using System.Threading;

namespace PE.SCCI.Slave
{
    class SCCISlaveAdapter : IDisposable
    {
        #region Constants

        private const int BUFFER_SIZE = 65000;
        private const int FRAME_MAX_SIZE = 16;
        private const ushort FRAME_START = 0xDB00;

        private const byte FUNCTION_CODE_MASK = 0x78;
        private const byte FUNCTION_SCODE_MASK = 0x07;
        private const byte FUNCTION_RR_MASK = 0x80;

        #endregion

        #region Fields

        private readonly object m_ReadSync = new object();
        private readonly AutoResetEvent m_DataReceivedEvent = new AutoResetEvent(false);
        private readonly ushort[] m_ReadBuffer;
        private readonly ushort[] m_WriteBuffer;
        private readonly byte[] m_RawReadBuffer;
        private readonly byte[] m_RawWriteBuffer;
        private readonly bool m_UseStreaming;
        private SerialPort m_Port;
        private int m_TimeoutSync, m_TimeoutSyncStream;
        private volatile int m_RawReadBufferLength;

        #endregion

        public SCCISlaveAdapter(bool UseStreaming)
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
        public void Initialize(SerialPortConfigurationSlave PortConfguration)
        {
            // Save parameters
            m_TimeoutSync = PortConfguration.TimeoutForSyncReceive;
            m_TimeoutSyncStream = PortConfguration.TimeoutForSyncStreamReceive;

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
                throw new SerialConnectionException("Communication exception: " + e.Message, e);
            }
        }

        public void Process()
        {
                        
        }

        #region Private members

        private void OpenConnection(SerialPortConfigurationSlave PortConfguration)
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
                throw new SerialConnectionException("Communication exception: " + e.Message, e);
            }
        }

        private void ResetReceiveBuffer()
        {
            lock (m_ReadSync)
                m_RawReadBufferLength = 0;
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
