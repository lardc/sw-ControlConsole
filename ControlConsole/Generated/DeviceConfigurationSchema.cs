using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.Diagnostics;
using System.Xml.Serialization;

namespace PE.ControlConsole.Generated
{
    // ReSharper disable InconsistentNaming
    // ReSharper disable ClassNeverInstantiated.Global
    /// <remarks />
    [GeneratedCode("xsd", "4.0.30319.1")]
    [Serializable]
    [DebuggerStepThrough]
    [DesignerCategory("code")]
    [XmlType(AnonymousType = true,
        Namespace = "http://www.proton-electrotex.com/TE/ControlConsole/DeviceConfigurationSchema.xsd")]
    [XmlRoot(Namespace = "http://www.proton-electrotex.com/TE/ControlConsole/DeviceConfigurationSchema.xsd",
        IsNullable = false)]
    public class configuration
    {
        /// <remarks />
        [XmlElement(Order = 0)] public configurationRegisters registers;

        /// <remarks />
        [XmlElement(Order = 1)] public configurationActions actions;

        /// <remarks />
        [XmlElement(Order = 2)] public configurationEndpoints endpoints;

        /// <remarks />
        [XmlElement(Order = 3)] public configurationConstants constants;

        /// <remarks />
        [XmlElement(Order = 4)] public configurationIncludes includes;
    }

    /// <remarks />
    [GeneratedCode("xsd", "4.0.30319.1")]
    [Serializable]
    [DebuggerStepThrough]
    [DesignerCategory("code")]
    [XmlType(AnonymousType = true,
        Namespace = "http://www.proton-electrotex.com/TE/ControlConsole/DeviceConfigurationSchema.xsd")]
    public class configurationRegisters
    {
        /// <remarks />
        [XmlElement("register", Order = 0)] public Bound_Type[] register;
    }

    /// <remarks />
    [GeneratedCode("xsd", "4.0.30319.1")]
    [Serializable]
    [DebuggerStepThrough]
    [DesignerCategory("code")]
    [XmlType(Namespace = "http://www.proton-electrotex.com/TE/ControlConsole/DeviceConfigurationSchema.xsd")]
    public class Bound_Type
    {
        /// <remarks />
        [XmlAttribute] public string name;

        /// <remarks />
        [XmlAttribute] public int value;
    }

    /// <remarks />
    [GeneratedCode("xsd", "4.0.30319.1")]
    [Serializable]
    [DebuggerStepThrough]
    [DesignerCategory("code")]
    [XmlType(AnonymousType = true,
        Namespace = "http://www.proton-electrotex.com/TE/ControlConsole/DeviceConfigurationSchema.xsd")]
    public class configurationActions
    {
        /// <remarks />
        [XmlElement("action", Order = 0)] public Bound_Type[] action;
    }

    /// <remarks />
    [GeneratedCode("xsd", "4.0.30319.1")]
    [Serializable]
    [DebuggerStepThrough]
    [DesignerCategory("code")]
    [XmlType(AnonymousType = true,
        Namespace = "http://www.proton-electrotex.com/TE/ControlConsole/DeviceConfigurationSchema.xsd")]
    public class configurationEndpoints
    {
        /// <remarks />
        [XmlElement("endpoint", Order = 0)] public Bound_Type[] endpoint;
    }

    /// <remarks />
    [GeneratedCode("xsd", "4.0.30319.1")]
    [Serializable]
    [DebuggerStepThrough]
    [DesignerCategory("code")]
    [XmlType(AnonymousType = true,
        Namespace = "http://www.proton-electrotex.com/TE/ControlConsole/DeviceConfigurationSchema.xsd")]
    public class configurationConstants
    {
        /// <remarks />
        [XmlElement("constant", Order = 0)] public Bound_Type[] constant;
    }

    /// <remarks />
    [GeneratedCode("xsd", "4.0.30319.1")]
    [Serializable]
    [DebuggerStepThrough]
    [DesignerCategory("code")]
    [XmlType(AnonymousType = true,
        Namespace = "http://www.proton-electrotex.com/TE/ControlConsole/DeviceConfigurationSchema.xsd")]
    public class configurationIncludes
    {
        /// <remarks />
        [XmlElement("include", Order = 0)] public string[] include;
    }
    // ReSharper restore InconsistentNaming
    // ReSharper restore ClassNeverInstantiated.Global
}