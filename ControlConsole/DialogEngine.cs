using System;
using System.Collections.Generic;
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
        
        internal DialogEngine()
        {
            m_RecreateContext = true;
        }

        internal void Run()
        {
            var input = new StringBuilder();

            while (!m_DoExit)
            {
                if (m_RecreateContext)
                {
                    m_RecreateContext = false;
                    CreateContext();
                    input = new StringBuilder("i(\"SiC_Main.js\")");
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


        #region Private members

        private static void InputCommand(StringBuilder Input)
        {
            Console.Write(Environment.NewLine + @" > ");

            Input.Clear();
            while (true)
            {
                var line = Console.ReadLine();
                if (String.IsNullOrWhiteSpace(line))
                    break;

                // ReSharper disable PossibleNullReferenceException
                Input.Append(line.TrimEnd(' '));
                // ReSharper restore PossibleNullReferenceException
                
                if (Input[Input.Length - 1] == '\\')
                {
                    Input[Input.Length - 1] = ' ';
                    Console.Write(@"   ");
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