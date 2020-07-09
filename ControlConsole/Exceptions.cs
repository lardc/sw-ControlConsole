using System;

namespace PE.ControlConsole
{
    [Serializable]
    internal class XmlConfigurationProcessingException : ApplicationException
    {
        internal XmlConfigurationProcessingException(string Message, Exception InnerException) :
            base(Message, InnerException)
        {
        }

        internal XmlConfigurationProcessingException(Exception InnerException) :
            base(InnerException.Message, InnerException)
        {
        }
    }
}
