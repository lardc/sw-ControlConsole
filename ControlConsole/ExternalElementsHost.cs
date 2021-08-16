using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.IO.Ports;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading;
using System.Text.RegularExpressions;
using Noesis.Javascript;
using PE.ControlConsole.Forms;

namespace PE.ControlConsole
{
    /// <summary>
    /// Contains external functions for JS engine
    /// </summary>
    internal class ExternalElementsHost: IDisposable
    {
        private readonly DialogEngine m_Dialog;
        private readonly DeviceFunctions m_DeviceObject;

        internal ExternalElementsHost(DialogEngine Dialog, JavascriptContext EngineContext)
        {
            m_Dialog = Dialog;
            m_DeviceObject = new DeviceFunctions();
            var configFunctions = new ConfigFunctions(this);
            
            // Set parameters - external functions
            EngineContext.SetParameter(@"cls", new Action(Clr));
            EngineContext.SetParameter(@"closew", new Action(CloseWindows));
            EngineContext.SetParameter(@"exec", new Action<string, string>(Execute));
            EngineContext.SetParameter(@"print", new Action<object>(Print));
            EngineContext.SetParameter(@"p", new Action<object>(Print));
            EngineContext.SetParameter(@"sleep", new Action<object>(Sleep));
            EngineContext.SetParameter(@"save", new Action<string, IList<object>>(Save));
            EngineContext.SetParameter(@"load", new Func<string, object[]>(Load));
            EngineContext.SetParameter(@"loadtihex", new Func<string, object[]>(LoadTIHex));
            EngineContext.SetParameter(@"loadbin", new Func<string, object[]>(LoadBin));
            EngineContext.SetParameter(@"help", new Action(Help));
            EngineContext.SetParameter(@"pl", new Action<IEnumerable<object>>(Plot));
            EngineContext.SetParameter(@"plot", new Action<IEnumerable<object>, double, double>(Plot));
            EngineContext.SetParameter(@"plot2", new Action<IEnumerable<object>, IEnumerable<object>, double, double>(Plot));
            EngineContext.SetParameter(@"plot3", new Action<IEnumerable<object>, IEnumerable<object>, IEnumerable<object>, double, double>(Plot));
            EngineContext.SetParameter(@"plotXY", new Action<IEnumerable<object>, IEnumerable<object>>(PlotXY));
            EngineContext.SetParameter(@"scatter", new Action<IEnumerable<object>, IEnumerable<object>>(PlotScatter));
            EngineContext.SetParameter(@"scattern", new Action<IEnumerable<object>, IEnumerable<object>, string, string, string>(PlotScatterNamed));
            EngineContext.SetParameter(@"reset", new Action(Reset));
            EngineContext.SetParameter(@"include", new Action<string>(Include));
            EngineContext.SetParameter(@"i", new Action<string>(Include));
            EngineContext.SetParameter(@"quit", new Action(Quit));
            EngineContext.SetParameter(@"uint", new Func<int, int, uint>(UInt32Wrap));
            EngineContext.SetParameter(@"portlist", new Func<string>(GetPortList));
            EngineContext.SetParameter(@"pp", new Action(PrintPortList));
            EngineContext.SetParameter(@"anykey", new Func<bool>(GetAnyKey));
            EngineContext.SetParameter(@"readkey", new Func<string>(ReadKey));
            EngineContext.SetParameter(@"readline", new Func<string>(ReadLine));
            EngineContext.SetParameter(@"create", new Func<string, object>(CreateInstance));
            EngineContext.SetParameter(@"create1", new Func<string, object, object>(CreateInstance));
            EngineContext.SetParameter(@"create2", new Func<string, object, object, object>(CreateInstance));
            EngineContext.SetParameter(@"loadlib", new Func<string, string, object>(LoadDLL));

            // Set parameters - external objects
            EngineContext.SetParameter(@"cin", Console.In);
            EngineContext.SetParameter(@"cout", Console.Out);
            EngineContext.SetParameter(@"cerr", Console.Error);
            EngineContext.SetParameter(@"cfg", configFunctions);
            EngineContext.SetParameter(@"dev", configFunctions.CreateDevice());
        }

        internal JavascriptContext ExecutionContext
        {
            get { return m_Dialog.ExecutionContext; }
        }

        internal void RequestPostOperation(Action Operation)
        {
            m_Dialog.RequestPostOperation(Operation);
        }

        #region Commands

        // ReSharper disable MemberCanBeMadeStatic.Local
        private uint UInt32Wrap(int Low, int High)
        {
            return (uint)Low | ((uint)High << 16);
        }

        private void Clr()
        {
            Console.Clear();
        }

        private void CloseWindows()
        {
            PlotForm.ClosePlotWindows();
        }

        private void Execute(string FileName, string Arguments)
        {
            Process.Start(FileName, Arguments);
        }

        private void Print(object Arg)
        {
            Console.WriteLine(Arg);
        }

        private void Sleep(object TimemSec)
        {
            if(TimemSec is int)
                Thread.Sleep((int)TimemSec);
            else
                Console.WriteLine(@"Bad argument: " + TimemSec);
        }

        private void Save(string FileName, IList<object> Array)
        {
            try
            {
                using (var stream = new FileStream(FileName, FileMode.Create, FileAccess.Write, FileShare.Read))
                    using (var writer = new StreamWriter(stream, Encoding.ASCII))
                        foreach (var t in Array)
                            writer.WriteLine("{0}", t);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }             
        }

        private object[] Load(string FileName)
        {
            try
            {
                using (var stream = new FileStream(FileName, FileMode.Open, FileAccess.Read, FileShare.Read))
                using (var reader = new StreamReader(stream, Encoding.ASCII))
                {
                    var result = new List<object>();
                    string data;

                    while ((data = reader.ReadLine()) != null)
                    {
                        string[] elements = data.Split(' ', ';', ',');
                        for (int i = 0; i < elements.Length; i++)
                        {
                            string element = elements[i].TrimEnd(' ', ';', ',');
                            result.Add(element);
                        }
                    }

                    return result.ToArray();
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                return null;
            }             
        }
        
        private object[] LoadTIHex(string FileName)
        {
            try
            {
                using (var stream = new FileStream(FileName, FileMode.Open, FileAccess.Read, FileShare.Read))
                using (var reader = new StreamReader(stream, Encoding.ASCII))
                {
                    var result = new List<object>();
                    string line;

                    while ((line = reader.ReadLine()) != null)
                    {
                        string[] elements = line.Split(null);

                        for (int i = 0; i < elements.Length; i++)
                        {
                            string element = elements[i].TrimEnd(' ', ';', ',');

                            if (Regex.IsMatch(element, @"^((\$A)[0-9a-fA-F]{6})$"))
                            {
                                Regex r = new Regex(@"([0-9a-fA-F]{6})$");
                                Match m = r.Match(element);
                                result.Add(m.Groups[1].Value);
                            }
                            else if (Regex.IsMatch(element, @"^[0-9a-fA-F]{2}$"))
                                result.Add(element);
                        }
                    }

                    return result.ToArray();
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        private object[] LoadBin(string FileName)
        {
            try
            {
                return File.ReadAllBytes(FileName).Cast<object>().ToArray();
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                throw;
            }
        }

        private void Reset()
        {
            m_Dialog.RequestRecreatingContext();
        }

        private void Quit()
        {
            m_Dialog.RequestExit();
        }

        private void Plot(IEnumerable<object> YValues)
        {
            try
            {
                PlotForm.RunPlot(YValues.Select(m => Convert.ToDouble(m, CultureInfo.InvariantCulture)), 1, 0);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }
        }

        private void Plot(IEnumerable<object> YValues, double Step, double InitX)
        {
            try
            {
                PlotForm.RunPlot(YValues.Select(m => Convert.ToDouble(m, CultureInfo.InvariantCulture)), Step, InitX);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }
        }

        private void Plot(IEnumerable<object> YValues1, IEnumerable<object> YValues2, double Step, double InitX)
        {
            try
            {
                PlotForm.RunPlot(YValues1.Select(m => Convert.ToDouble(m, CultureInfo.InvariantCulture)).ToList(),
                                 YValues2.Select(m => Convert.ToDouble(m, CultureInfo.InvariantCulture)).ToList(), Step, InitX);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }
        }

        private void Plot(IEnumerable<object> YValues1, IEnumerable<object> YValues2, IEnumerable<object> YValues3, double Step, double InitX)
        {
            try
            {
                PlotForm.RunPlot(YValues1.Select(m => Convert.ToDouble(m, CultureInfo.InvariantCulture)).ToList(),
                                 YValues2.Select(m => Convert.ToDouble(m, CultureInfo.InvariantCulture)).ToList(),
                                 YValues3.Select(m => Convert.ToDouble(m, CultureInfo.InvariantCulture)).ToList(), Step, InitX);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }
        }

        private void PlotXY(IEnumerable<object> XValues, IEnumerable<object> YValues)
        {
            try
            {
                PlotForm.RunPlot(XValues.Select(m => Convert.ToDouble(m, CultureInfo.InvariantCulture)).ToList(),
                                 YValues.Select(m => Convert.ToDouble(m, CultureInfo.InvariantCulture)).ToList());
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }
        }

        private void PlotScatter(IEnumerable<object> XValues, IEnumerable<object> YValues)
        {
            try
            {
                PlotForm.RunPlot(XValues.Select(m => Convert.ToDouble(m, CultureInfo.InvariantCulture)).ToList(),
                                 YValues.Select(m => Convert.ToDouble(m, CultureInfo.InvariantCulture)).ToList(), true);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }
        }

        private void PlotScatterNamed(IEnumerable<object> XValues, IEnumerable<object> YValues, string XName, string YName, string PlotName)
        {
            try
            {
                PlotForm.RunPlot(XValues.Select(m => Convert.ToDouble(m, CultureInfo.InvariantCulture)).ToList(),
                                 YValues.Select(m => Convert.ToDouble(m, CultureInfo.InvariantCulture)).ToList(), true, XName, YName, PlotName);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }
        }

        private void Help()
        {
            try
            {
                using (var stream = Assembly.GetExecutingAssembly().GetManifestResourceStream("PE.ControlConsole.CommandHelp.txt"))
                    if (stream != null)
                    {
                        using (var reader = new StreamReader(stream))
                            Console.Write(reader.ReadToEnd());
                    }
                    else
                    {
                        Console.WriteLine(@"Internal error: specified resource was not found");
                    }
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }
        }

        private void Include(string FileName)
        {
            try
            {
                if (!File.Exists(FileName))
                    if (File.Exists(Path.Combine("include/", FileName)))
                        FileName = Path.Combine("include/", FileName);
                    else
                        throw new InvalidOperationException("Specified file not found");

                using (var stream = new FileStream(FileName, FileMode.Open, FileAccess.Read, FileShare.Read))
                {
                    using (var reader = new StreamReader(stream))
                    {
                        var script = reader.ReadToEnd();
                        RequestPostOperation(() => m_Dialog.ExecutionContext.Run(script));
                    }
                }
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
            }
        }

        private string GetPortList()
        {
            try
            {
                var PortsArray = SerialPort.GetPortNames();
                if (PortsArray.Length > 0)
                    return PortsArray.Aggregate((Result, Element) => Result + " " + Element);
                else
                    return @"Not found";
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);

                return String.Empty;
            }
        }

        private void PrintPortList()
        {
            Console.WriteLine(GetPortList());
        }

        private bool GetAnyKey()
        {
            if (Console.KeyAvailable)
            {
                Console.ReadKey(true);

                return true;
            }

            return false;
        }

        private string ReadKey()
        {
            return (Console.ReadKey(true).KeyChar).ToString(CultureInfo.InvariantCulture);
        }

        private string ReadLine()
        {
            return Console.ReadLine().ToString(CultureInfo.InvariantCulture);
        }

        private object CreateInstance(string TypeName)
        {
            try
            {
                return Activator.CreateInstance(Type.GetType(TypeName));
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                return null;
            }
        }

        private object CreateInstance(string TypeName, object Arg)
        {
            try
            {
                return Activator.CreateInstance(Type.GetType(TypeName), Arg);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                return null;
            }
        }

        private object CreateInstance(string TypeName, object Arg1, object Arg2)
        {
            try
            {
                return Activator.CreateInstance(Type.GetType(TypeName), Arg1, Arg2);
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                return null;
            }
        }

        private object LoadDLL(string DLLName, string MethodName)
        {
            try
            {
                var dllFile = new FileInfo(DLLName);
                var DLL = Assembly.LoadFile(dllFile.FullName);

                foreach (Type type in DLL.GetExportedTypes())
                {
                    if (String.Compare(type.ToString(), MethodName) == 0)
                        return Activator.CreateInstance(type);
                }

                Console.WriteLine("Method {0} not found", MethodName);
                return null;
            }
            catch (Exception e)
            {
                Console.WriteLine(e.Message);
                return null;
            }
        }


        // ReSharper restore MemberCanBeMadeStatic.Local

        #endregion

        #region Implementation of IDisposable

        public void Dispose()
        {
            m_DeviceObject.Dispose();
        }

        #endregion
    }
}