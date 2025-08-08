using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Noesis.Javascript;

namespace PE.ControlConsole
{
    internal class DialogEngine: IDisposable
    {
        private JavascriptContext m_Context;
        private ExternalElementsHost m_Elements;
        private readonly Queue<Action> m_PostOperations = new Queue<Action>();
        private bool m_RecreateContext, m_DoExit;
        private AutoCompletionHandler m_AutocompletionHandler = new AutoCompletionHandler();
        
        internal DialogEngine()
        {
            m_RecreateContext = true;
        }

        internal void Run()
        {
            ReadLine.AutoCompletionHandler = m_AutocompletionHandler;
            var input = new StringBuilder();

            while (!m_DoExit)
            {
                if (m_RecreateContext)
                {
                    m_RecreateContext = false;
                    CreateContext();

                    input = new StringBuilder("i(\"Common.js\")");
                }
                else
                    InputCommand(input);

                try
                {
                    m_Context.Run(input.ToString());
                }
                catch (JavascriptException e)
                {
                    Console.WriteLine(Environment.NewLine + e.Message);
                }
                catch (Exception e)
                {
                    Console.WriteLine(Environment.NewLine + e.Message);
                }

                while (m_PostOperations.Count > 0)
                    m_PostOperations.Dequeue()();
            }
        }

        internal JavascriptContext ExecutionContext
        {
            get { return m_Context; }
        }

        internal void SetFunctionList(string[] functionList)
        {
            m_AutocompletionHandler.SetFunctionList(functionList);
        }


        #region Private members

        private static void InputCommand(StringBuilder Input)
        {
            Input.Clear();
            string prompt = Environment.NewLine + " > ";

            while (true)
            {
                var line = ReadLine.Read(prompt);
                ReadLine.AddHistory(line);

                if (String.IsNullOrWhiteSpace(line))
                    break;

                // ReSharper disable PossibleNullReferenceException
                Input.Append(line.TrimEnd(' '));
                // ReSharper restore PossibleNullReferenceException
                
                if (Input[Input.Length - 1] == '\\')
                {
                    Input[Input.Length - 1] = ' ';
                }
                else
                    break;
            }
        }

        private void CreateContext()
        {
            FreeContext();

            m_Context = new JavascriptContext();
            m_Elements = new ExternalElementsHost(this, m_Context);
        }

        private void FreeContext()
        {
            if (m_Context != null)
                m_Context.Dispose();

            if (m_Elements != null)
                m_Elements.Dispose();
        }

        #endregion

        #region Internal members

        internal void RequestRecreatingContext()
        {
            m_RecreateContext = true;
        }

        internal void RequestExit()
        {
            m_DoExit = true;
        }

        internal void RequestPostOperation(Action Operation)
        {
            m_PostOperations.Enqueue(Operation);
        }

        #endregion

        #region Implementation of IDisposable

        public void Dispose()
        {
            FreeContext();
        }

        #endregion
    }
}