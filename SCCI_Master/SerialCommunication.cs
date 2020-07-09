using System;
using System.IO.Ports;

namespace PE.SCCI
{
    /// <summary>
    /// Serial port parameters
    /// </summary>
    public sealed class SerialPortConfigurationMaster
    {
        /// <summary>
        /// Port number (COMx)
        /// </summary>
        public int PortNumber { get; set; }
        /// <summary>
        /// Baudrate (bps)
        /// </summary>
        public int BaudRate { get; set; }
        /// <summary>
        /// Data bits per byte - 7/8
        /// </summary>
        public int DataBits { get; set; }
        /// <summary>
        /// Stop bits (1, 1.5, 2)
        /// </summary>
        public StopBits StopBits { get; set; }
        /// <summary>
        /// Kind of parity
        /// </summary>
        public Parity ParityMode { get; set; }
        /// <summary>
        /// Timeout for synchronous requests
        /// </summary>
        public int TimeoutForSyncReceive { get; set; }
        /// <summary>
        /// Timeout for synchronous requests with streamed transmission
        /// </summary>
        public int TimeoutForSyncStreamReceive { get; set; }
        /// <summary>
        /// Count of attempts to transmit data on packet and CRC error
        /// </summary>
        public int RetransmitsCountOnError { get; set; }
        /// <summary>
        /// Use retransmits during array transfer
        /// </summary>
        public bool UseRetransmitsForArrays { get; set; }
        /// <summary>
        /// Use retransmits during array transfer
        /// </summary>
        public bool RetransmitOnTimeout { get; set; }
    }

    /// <summary>
    /// Serial port parameters
    /// </summary>
    public sealed class SerialPortConfigurationSlave
    {
        /// <summary>
        /// Port number (COMx)
        /// </summary>
        public int PortNumber { get; set; }
        /// <summary>
        /// Baudrate (bps)
        /// </summary>
        public int BaudRate { get; set; }
        /// <summary>
        /// Data bits per byte - 7/8
        /// </summary>
        public int DataBits { get; set; }
        /// <summary>
        /// Stop bits (1, 1.5, 2)
        /// </summary>
        public StopBits StopBits { get; set; }
        /// <summary>
        /// Kind of parity
        /// </summary>
        public Parity ParityMode { get; set; }
        /// <summary>
        /// Timeout for synchronous requests
        /// </summary>
        public int TimeoutForSyncReceive { get; set; }
        /// <summary>
        /// Timeout for synchronous requests with streamed transmission
        /// </summary>
        public int TimeoutForSyncStreamReceive { get; set; }
    }

    /// <summary>
    /// Problems with connection
    /// </summary>
    [Serializable]
    public class SerialConnectionException : ApplicationException
    {
        public SerialConnectionException(string Message, Exception InnerException) :
            base(Message, InnerException) { }
    }

    /// <summary>
    /// Timeout of request to device
    /// </summary>
    [Serializable]
    public class SerialConnectionTimeoutException : SerialConnectionException
    {
        public SerialConnectionTimeoutException(string Message) :
            base(Message, null) { }
    }
}
