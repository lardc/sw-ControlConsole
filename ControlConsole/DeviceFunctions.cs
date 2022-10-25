﻿using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using PE.ControlConsole.Properties;
using PE.SCCI;
using PE.SCCI.Master;
using NationalInstruments.Visa;

namespace PE.ControlConsole
{
    internal class DeviceFunctions : IDisposable
    {
        private readonly SCCIMasterAdapter m_Adapter = new SCCIMasterAdapter(true);
        private int m_Baudrate = Settings.Default.SerialBaudrate;
        private int m_Retransmits = Settings.Default.RetransmitsCount;
        private bool m_UseRetransmitsForArrays = Settings.Default.UseRetransmitsForArrays;

        #region Properties

        // ReSharper disable MemberCanBePrivate.Global
        // ReSharper disable UnusedMember.Global

        public int Baudrate
        {
            get { return m_Baudrate; }
            set { m_Baudrate = value; }
        }

        public int RetransmitsCount
        {
            get { return m_Retransmits; }
            set { m_Retransmits = value; }
        }

        public bool UseRetransmitsForArrays
        {
            get { return m_UseRetransmitsForArrays; }
            set { m_UseRetransmitsForArrays = value; }
        }

        public int NodeID { get; set; }

        #endregion

        #region Methods

        public void Connect(int ComPortNumber)
        {
            if (m_Adapter.Connected)
                Disconnect();

            try
            {
                m_Adapter.Initialize(new SerialPortConfigurationMaster
                {
                    BaudRate = Baudrate,
                    DataBits = 8,
                    ParityMode = Settings.Default.SerialParity,
                    PortNumber = ComPortNumber,
                    StopBits = Settings.Default.SerialStopBits,
                    TimeoutForSyncReceive = Settings.Default.RequestTimeout_ms,
                    TimeoutForSyncStreamReceive = Settings.Default.StreamingTimeout_ms,
                    RetransmitsCountOnError = m_Retransmits,
                    UseRetransmitsForArrays = m_UseRetransmitsForArrays
                });

                NodeID = 0;
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public void co(int ComPortNumber)
        // ReSharper restore InconsistentNaming
        {
            Connect(ComPortNumber);
        }

        public void Connect(int ComPortNumber, int CustomBaudRate)
        {
            if (m_Adapter.Connected)
                Disconnect();

            try
            {
                m_Adapter.Initialize(new SerialPortConfigurationMaster
                {
                    BaudRate = CustomBaudRate,
                    DataBits = 8,
                    ParityMode = Settings.Default.SerialParity,
                    PortNumber = ComPortNumber,
                    StopBits = Settings.Default.SerialStopBits,
                    TimeoutForSyncReceive = Settings.Default.RequestTimeout_ms,
                    TimeoutForSyncStreamReceive = Settings.Default.StreamingTimeout_ms,
                    RetransmitsCountOnError = m_Retransmits,
                    UseRetransmitsForArrays = m_UseRetransmitsForArrays
                });
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public void co(int ComPortNumber, int CustomBaudRate)
        // ReSharper restore InconsistentNaming
        {
            Connect(ComPortNumber, CustomBaudRate);
        }

        public void Disconnect()
        {
            try
            {
                m_Adapter.Close();
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public void dco()
        // ReSharper restore InconsistentNaming
        {
            Disconnect();
        }

        public void SetNodeID(int NewNodeID)
        {
            NodeID = NewNodeID;
        }

        // ReSharper disable InconsistentNaming
        public void nid(int NewNodeID)
        // ReSharper restore InconsistentNaming
        {
            SetNodeID(NewNodeID);
        }

        public int GetNodeID()
        {
            return NodeID;
        }

        public void Write16Silent(int Address, int Data)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                m_Adapter.Write16((ushort)NodeID, (ushort)Address, (ushort)Data);
            }
            catch (Exception)
            {
                throw;
            }
        }

        public void Write16(int Address, int Data)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                m_Adapter.Write16((ushort)NodeID, (ushort)Address, (ushort)Data);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public void w(int Address, int Data)
        // ReSharper restore InconsistentNaming
        {
            Write16(Address, Data);
        }

        public void Write16S(int Address, int Data)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                m_Adapter.Write16S((ushort)NodeID, (ushort)Address, (short)Data);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public void ws(int Address, int Data)
        // ReSharper restore InconsistentNaming
        {
            Write16S(Address, Data);
        }

        public void Write16(int Address1, int Data1, int Address2, int Data2)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                m_Adapter.Write16((ushort)NodeID, (ushort)Address1, (ushort)Data1, (ushort)Address2, (ushort)Data2);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public void w(int Address1, int Data1, int Address2, int Data2)
        // ReSharper restore InconsistentNaming
        {
            Write16(Address1, Data1, Address2, Data2);
        }

        public void Write16S(int Address1, int Data1, int Address2, int Data2)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                m_Adapter.Write16S((ushort)NodeID, (ushort)Address1, (short)Data1, (ushort)Address2, (short)Data2);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public void ws(int Address1, int Data1, int Address2, int Data2)
        // ReSharper restore InconsistentNaming
        {
            Write16S(Address1, Data1, Address2, Data2);
        }

        public void Write32(int Address, uint Data)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                m_Adapter.Write32((ushort)NodeID, (ushort)Address, Data);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public void wl(int Address, uint Data)
        // ReSharper restore InconsistentNaming
        {
            Write32(Address, Data);
        }

        public void Write32S(int Address, int Data)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                m_Adapter.Write32S((ushort)NodeID, (ushort)Address, Data);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public void wls(int Address, int Data)
        // ReSharper restore InconsistentNaming
        {
            Write32S(Address, Data);
        }

        public void WriteFloat(int Address, float Data)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                m_Adapter.WriteFloat((ushort)NodeID, (ushort)Address, Data);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public void wf(int Address, float Data)
        // ReSharper restore InconsistentNaming
        {
            WriteFloat(Address, Data);
        }

        public int Read16Silent(int Address)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                return m_Adapter.Read16((ushort)NodeID, (ushort)Address);
            }
            catch (Exception)
            {
                throw;
            }
        }

        public int Read16(int Address)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                return m_Adapter.Read16((ushort)NodeID, (ushort)Address);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public int r(int Address)
        // ReSharper restore InconsistentNaming
        {
            return Read16(Address);
        }

        public int Read16S(int Address)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                return m_Adapter.Read16S((ushort)NodeID, (ushort)Address);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public int rs(int Address)
        // ReSharper restore InconsistentNaming
        {
            return Read16S(Address);
        }

        public int[] Read16(int Address1, int Address2)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                return m_Adapter.Read16((ushort)NodeID, (ushort)Address1, (ushort)Address2).Select(Arg => (int)Arg).ToArray();
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public int[] r(int Address1, int Address2)
        // ReSharper restore InconsistentNaming
        {
            return Read16(Address1, Address2);
        }

        public int[] Read16S(int Address1, int Address2)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                return m_Adapter.Read16S((ushort)NodeID, (ushort)Address1, (ushort)Address2).Select(Arg => (int)Arg).ToArray();
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public int[] rs(int Address1, int Address2)
        // ReSharper restore InconsistentNaming
        {
            return Read16S(Address1, Address2);
        }

        public long Read32(int Address)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                return m_Adapter.Read32((ushort)NodeID, (ushort)Address);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public long rl(int Address)
        // ReSharper restore InconsistentNaming
        {
            return Read32(Address);
        }

        public long Read32S(int Address)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                return m_Adapter.Read32S((ushort)NodeID, (ushort)Address);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public long rls(int Address)
        // ReSharper restore InconsistentNaming
        {
            return Read32S(Address);
        }

        public float ReadFloatSilent(int Address)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                return m_Adapter.ReadFloat((ushort)NodeID, (ushort)Address);
            }
            catch (Exception)
            {
                throw;
            }
        }

        public float ReadFloat(int Address)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                return m_Adapter.ReadFloat((ushort)NodeID, (ushort)Address);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public float rf(int Address)
        // ReSharper restore InconsistentNaming
        {
            return ReadFloat(Address);
        }

        public float ReadLimitFloatX(int Address, bool HighLimit)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                return m_Adapter.ReadLimitFloat((ushort)NodeID, (ushort)Address, HighLimit);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        public float ReadLimitFloatLow(int Address)
        {
            return ReadLimitFloatX(Address, false);
        }

        // ReSharper disable InconsistentNaming
        public float rlfl(int Address)
        // ReSharper restore InconsistentNaming
        {
            return ReadLimitFloatLow(Address);
        }

        public float ReadLimitFloatHigh(int Address)
        {
            return ReadLimitFloatX(Address, true);
        }

        // ReSharper disable InconsistentNaming
        public float rlfh(int Address)
        // ReSharper restore InconsistentNaming
        {
            return ReadLimitFloatHigh(Address);
        }

        public int[] ReadArray16(int Address, int MaxCount = int.MaxValue)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                return m_Adapter.ReadArray16((ushort)NodeID, (ushort)Address, MaxCount).Select(Arg => (int)Arg).ToArray();
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public int[] ra(int Address, int MaxCount = int.MaxValue)
        // ReSharper restore InconsistentNaming
        {
            return ReadArray16(Address, MaxCount);
        }

        public int[] ReadArray16S(int Address, int MaxCount = int.MaxValue)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                return m_Adapter.ReadArray16S((ushort)NodeID, (ushort)Address, MaxCount).Select(Arg => (int)Arg).ToArray();
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public int[] ras(int Address, int MaxCount = int.MaxValue)
        // ReSharper restore InconsistentNaming
        {
            return ReadArray16S(Address, MaxCount);
        }

        public long[] ReadArray32(int Address, int MaxCount = int.MaxValue)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                return m_Adapter.ReadArray32((ushort)NodeID, (ushort)Address, MaxCount).Select(Arg => (long)Arg).ToArray();
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public long[] rla(int Address, int MaxCount = int.MaxValue)
        // ReSharper restore InconsistentNaming
        {
            return ReadArray32(Address, MaxCount);
        }

        public long[] ReadArray32S(int Address, int MaxCount = int.MaxValue)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                return m_Adapter.ReadArray32S((ushort)NodeID, (ushort)Address, MaxCount).Select(Arg => (long)Arg).ToArray();
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public long[] rlas(int Address, int MaxCount = int.MaxValue)
        // ReSharper restore InconsistentNaming
        {
            return ReadArray32S(Address, MaxCount);
        }

        public void WriteArray16(int Address, IEnumerable<object> Data)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                m_Adapter.WriteArray16((ushort)NodeID, (ushort)Address, Data.Select(Convert.ToUInt16).ToArray());
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public void wa(int Address, IEnumerable<object> Data)
        // ReSharper restore InconsistentNaming
        {
            WriteArray16(Address, Data);
        }

        public void WriteArray16S(int Address, IEnumerable<object> Data)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                m_Adapter.WriteArray16S((ushort)NodeID, (ushort)Address, Data.Select(Convert.ToInt16).ToArray());
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public void was(int Address, IEnumerable<object> Data)
        // ReSharper restore InconsistentNaming
        {
            WriteArray16S(Address, Data);
        }

        public void Call(int ActionID)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                m_Adapter.Call((ushort)NodeID, (ushort)ActionID);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public void c(int ActionID)
        // ReSharper restore InconsistentNaming
        {
            Call(ActionID);
        }

        public int[] ReadArrayFast16(int Address)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                return m_Adapter.ReadArrayFast16((ushort)NodeID, (ushort)Address).Select(Arg => (int)Arg).ToArray();
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public int[] raf(int Address)
        // ReSharper restore InconsistentNaming
        {
            return ReadArrayFast16(Address);
        }

        public int[] ReadArrayFast16S(int Address)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                return m_Adapter.ReadArrayFast16S((ushort)NodeID, (ushort)Address).Select(Arg => (int)Arg).ToArray();
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public int[] rafs(int Address)
        // ReSharper restore InconsistentNaming
        {
            return ReadArrayFast16S(Address);
        }

        public float[] ReadArrayFastFloat(int Address)
        {
            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                return m_Adapter.ReadArrayFastFloat((ushort)NodeID, (ushort)Address).Select(Arg => (float)Arg).ToArray();
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public float[] raff(int Address)
        // ReSharper restore InconsistentNaming
        {
            return ReadArrayFastFloat(Address);
        }

        public void SendString(string OutString)
        {
            try
            {
                m_Adapter.SendString(OutString, false).ToArray();
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public void ss(string OutString)
        // ReSharper restore InconsistentNaming
        {
            SendString(OutString);
        }

        public object[] SendStringWithReply(string OutString)
        {
            try
            {
                return m_Adapter.SendString(OutString, true).ToArray();
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming
        public object[] sswr(string OutString)
        // ReSharper restore InconsistentNaming
        {
            return SendStringWithReply(OutString);
        }

        public void Dump(string FileName, int StartAddress, int EndAddress)
        {
            bool UseFloat = true;

            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                m_Adapter.ReadFloat((ushort)NodeID, 0);
            }
            catch (ProtocolErrorFrameException e)
            {
                if (e.Error == SCCIErrors.InvalidSfunction || e.Error == SCCIErrors.NotSupported)
                    UseFloat = false;
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }

            try
            {
                using (var stream = new FileStream(FileName, FileMode.Create, FileAccess.Write, FileShare.Read))
                using (var writer = new StreamWriter(stream, Encoding.ASCII))
                    for (var i = StartAddress; i <= EndAddress; i++)
                    {
                        var data = UseFloat ? m_Adapter.ReadFloat((ushort)NodeID, (ushort)i) :
                            m_Adapter.Read16((ushort)NodeID, (ushort)i);
                        writer.WriteLine("{0}; {1};", i, data);
                    }
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        public void Restore(string FileName)
        {
            bool UseFloat = true;

            try
            {
                if (!m_Adapter.Connected)
                    throw new InvalidOperationException("No connection to device");

                m_Adapter.ReadFloat((ushort)NodeID, 0);
            }
            catch (ProtocolErrorFrameException e)
            {
                if (e.Error == SCCIErrors.InvalidSfunction || e.Error == SCCIErrors.NotSupported)
                    UseFloat = false;
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }

            try
            {
                using (var stream = new FileStream(FileName, FileMode.Open, FileAccess.Read, FileShare.Read))
                using (var reader = new StreamReader(stream, Encoding.ASCII))
                {
                    string data;

                    while ((data = reader.ReadLine()) != null)
                    {
                        var values = data.Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries);
                        ushort reg = ushort.Parse(values[0]);
                        float value = float.Parse(values[1]);

                        if (UseFloat)
                        {
                            m_Adapter.WriteFloat((ushort)NodeID, reg, value);
                        }
                        else
                        {
                            m_Adapter.Write16((ushort)NodeID, reg, (ushort)value);
                        }

                    }
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        #endregion

        #region Implementation of IDisposable

        public void Dispose()
        {
            // ReSharper disable EmptyGeneralCatchClause
            try
            {
                if (m_Adapter.Connected)
                    m_Adapter.Close();
            }
            catch { }
            // ReSharper restore EmptyGeneralCatchClause
        }

        #endregion
    }

    internal class TMCFunctions : IDisposable
    {
        private readonly ResourceManager rmSession = new ResourceManager();
        private MessageBasedSession mbSession;
        private bool IsConnected = false;

        private string ReplaceCommonEscapeSequences(string s)
        {
            return s.Replace("\n", " ").Replace("\r", " ");
        }

        public void list()
        {
            try
            {
                var resources = rmSession.Find("(USB)?*");
                foreach (string s in resources)
                    Console.WriteLine(ReplaceCommonEscapeSequences(s));
            }
            catch { }
        }

        public void co()
        {
            try
            {
                if (IsConnected)
                {
                    IsConnected = false;
                    mbSession.Dispose();
                }
            }
            catch { }

            try
            {
                var resources = rmSession.Find("(USB)?*");
                mbSession = (MessageBasedSession)rmSession.Open(resources.First());
                IsConnected = true;
            }
            catch(Exception)
            {
                Console.WriteLine("No attached USB TMC devices");
            }
        }

        public void dco()
        {
            try
            {
                if (IsConnected)
                {
                    IsConnected = false;
                    mbSession.Dispose();
                }
            }
            catch { }
        }

        public string query(string Command)
        {
            try
            {
                if (!IsConnected)
                    throw new InvalidOperationException("No connection to TMC device");

                mbSession.RawIO.Write(Command);
                return ReplaceCommonEscapeSequences(mbSession.RawIO.ReadString());
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        public void write(string Command)
        {
            try
            {
                if (!IsConnected)
                    throw new InvalidOperationException("No connection to TMC device");

                mbSession.RawIO.Write(Command);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        public string read()
        {
            try
            {
                if (!IsConnected)
                    throw new InvalidOperationException("No connection to TMC device");

                return ReplaceCommonEscapeSequences(mbSession.RawIO.ReadString());
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        public void Dispose()
        {
            try
            {
                if (IsConnected)
                    mbSession.Dispose();

                rmSession.Dispose();
            }
            catch { }
        }
    }
}
