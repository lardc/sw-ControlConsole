using System;

namespace PE.SCCI
{
    #region Internal enums

    internal enum SCCIFunctions
    {
        None        = 0,
        Write       = 1,
        Read        = 2,
        WriteBlock  = 3,
        ReadBlock   = 4,
        Call        = 5,
        Error       = 6,
        ReadFast    = 7
    }

    internal enum SCCISubFunctions
    {
        None            = 0,
        Sfunc16         = 1,
        Sfunc32         = 2,
        Sfunc16Double   = 3,
        SFuncRep16      = 3,
        SFuncRep32      = 4
    }

    #endregion

    #region Public enums

    // ReSharper disable UnusedMember.Global
    public enum SCCIErrors
    {
        Timeout             = 1,
        BadCRC              = 2,
        InvalidFunction     = 3,
        InvalidAddess       = 4,
        InvalidSfunction    = 5,
        InvalidAction       = 6,
        InvalidEndpoint     = 7,
        IllegalSize         = 8,
        TooLongStream       = 9,
        NotSupported        = 10,
        WriteProtected      = 11,
        ValidationFailed    = 12,
        OperationBlocked    = 13,
        UserError           = 255
    }
    // ReSharper restore UnusedMember.Global
    
    #endregion

    #region Exceptions

    public class ProtocolException : ApplicationException
    {
        protected ProtocolException(string Message) : base(Message) { }
    }

    public class ProtocolInvaidPacketFormatException : ProtocolException
    {
        public ProtocolInvaidPacketFormatException(string Message) : base(Message) { }
    }

    public class ProtocolErrorFrameException : ProtocolException
    {
        public SCCIErrors Error { get; private set; }
        public ushort Details { get; private set; }
        
        public ProtocolErrorFrameException(string Message, SCCIErrors Error, ushort Details) : base(Message)
        {
            this.Error = Error;
            this.Details = Details;
        }
    }

    public class ProtocolErrorFrameInvalidHeaderException : ProtocolErrorFrameException
    {
        public ProtocolErrorFrameInvalidHeaderException(string Message, SCCIErrors Error, ushort Details)
            : base(Message, Error, Details)
        {
        }
    }

    public class ProtocolErrorFrameInvalidCRCException : ProtocolErrorFrameException
    {
        public ProtocolErrorFrameInvalidCRCException(string Message, SCCIErrors Error, ushort Details)
            : base(Message, Error, Details)
        {
        }
    }

    public class ProtocolInvaidFunctionException : ProtocolException
    {
        public ushort Code { get; private set; }
        
        public ProtocolInvaidFunctionException(string Message, ushort Code) : base(Message)
        {
            this.Code = Code;            
        }
    }

    public class ProtocolTimeoutException : ProtocolException
    {
        public ProtocolTimeoutException(string Message) : base(Message) { }
    }

    public class ProtocolBadCRCException : ProtocolException
    {
        public ushort CRCReceived { get; private set; }
        public ushort CRCComputed { get; private set; }

        public ProtocolBadCRCException(string Message, ushort CRCReceived, ushort CRCComputed)
            : base(Message)
        {
            this.CRCReceived = CRCReceived;
            this.CRCComputed = CRCComputed;
        }
    }

    #endregion
}
