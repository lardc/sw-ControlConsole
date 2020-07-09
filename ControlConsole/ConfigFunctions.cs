using System;
using System.IO;
using System.Reflection;
using System.Xml;
using System.Xml.Schema;
using System.Xml.Serialization;
using Noesis.Javascript;

namespace PE.ControlConsole
{
    internal class ConfigFunctions
    {
        private readonly ExternalElementsHost m_Host;
        private Generated.configuration m_Config;

        internal ConfigFunctions(ExternalElementsHost Host)
        {
            m_Host = Host;
        }

        #region Methods

        // ReSharper disable UnusedMember.Global
        public void LoadProfile(string Name)
        {
            try
            {
                m_Config = LoadConfiguration("PE.ControlConsole.DeviceConfigurationSchema.xsd", Name);

                m_Host.RequestPostOperation(SetDeviceParameters);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        // ReSharper disable InconsistentNaming 
        public void lp(string Name)
        {
            LoadProfile(Name);
        }
        // ReSharper restore InconsistentNaming

        public DeviceFunctions CreateDevice()
        {
            return new DeviceFunctions();
        }

        // ReSharper disable InconsistentNaming 
        public DeviceFunctions cd()
        {
            return CreateDevice();
        }
        // ReSharper restore InconsistentNaming
        // ReSharper restore UnusedMember.Global

        #endregion

        #region Private members

        private void SetDeviceParameters()
        {
            try
            {
                if (m_Config.registers.register != null)
                    foreach (var register in m_Config.registers.register)
                        m_Host.ExecutionContext.SetParameter(register.name, register.value);

                if (m_Config.actions.action != null)
                    foreach (var action in m_Config.actions.action)
                        m_Host.ExecutionContext.SetParameter(action.name, action.value);

                if (m_Config.endpoints.endpoint != null)
                    foreach (var endpoint in m_Config.endpoints.endpoint)
                        m_Host.ExecutionContext.SetParameter(endpoint.name, endpoint.value);

                if (m_Config.constants.constant != null)
                    foreach (var constant in m_Config.constants.constant)
                        m_Host.ExecutionContext.SetParameter(constant.name, constant.value);

                if (m_Config.includes.include != null)
                    foreach (var include in m_Config.includes.include)
                    {
                        try
                        {
                            using (var stream = new FileStream(include, FileMode.Open, FileAccess.Read, FileShare.Read))
                            {
                                using (var reader = new StreamReader(stream))
                                {
                                    var script = reader.ReadToEnd();
                                    m_Host.ExecutionContext.Run(script);
                                }
                            }
                        }
                        catch (JavascriptException e)
                        {
                            Console.WriteLine(Environment.NewLine + e.Message);
                        }
                        catch (Exception e)
                        {
                            Console.WriteLine(Environment.NewLine + e.Message);
                        }
                    }
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }
        }
        
        private Generated.configuration LoadConfiguration(string SchemaPath, string DataPath)
        {
            // Load data from file
            var result = LoadDocumentData(SchemaPath, DataPath);

            // Process files
            try
            {
                return CreateDocumentAndSchema(result.Item1, result.Item2);
            }
            finally
            {
                // Close resources
                result.Item2.Dispose();
            }
        }

        private static Tuple<XmlSchema, Stream> LoadDocumentData(string SchemaResourceName, string DataPath)
        {
            FileStream contentStream;
            XmlSchema schema;

            try
            {
                var schemaStream = Assembly.GetExecutingAssembly().GetManifestResourceStream(SchemaResourceName);

                if(schemaStream == null)
                    throw new XmlConfigurationProcessingException("Internal error: can't load XSD", new Exception());

                try
                {
                    // Process and validate scheme
                    schema = XmlSchema.Read(schemaStream, null);
                }
                catch (XmlSchemaException e)
                {
                    throw new XmlConfigurationProcessingException("Internal error: bad format of XSD", e);
                }
                finally
                {
                    // Close schema source
                    schemaStream.Close();
                }

                contentStream = new FileStream(DataPath, FileMode.Open, FileAccess.Read);
            }
            catch (Exception e)
            {
                throw new XmlConfigurationProcessingException(e);
            }

            return new Tuple<XmlSchema, Stream>(schema, contentStream);
        }

        private static Generated.configuration CreateDocumentAndSchema(XmlSchema Schema, Stream ContentStream)
        {
            Generated.configuration result;
            
            var readerSettings = new XmlReaderSettings
            {
                ValidationType = ValidationType.Schema,
                IgnoreComments = true,
                CloseInput = true
            };
            readerSettings.Schemas.Add(Schema);

            var reader = XmlReader.Create(ContentStream, readerSettings);
            try
            {
                var xmlSerial = new XmlSerializer(typeof(Generated.configuration));
                result = (Generated.configuration)xmlSerial.Deserialize(reader);
            }
            catch (InvalidOperationException e)
            {
                throw new XmlConfigurationProcessingException("Bad format of device schema", e);
            }
            finally
            {
                reader.Close();
            }

            return result;
        }

        #endregion
    }
}