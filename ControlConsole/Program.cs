using System;

namespace PE.ControlConsole
{
    internal static class Program
    {
        private static void Main()
        {
            Console.WriteLine(Environment.NewLine + @"IGBT dynamic control console, v1.0");
            Console.WriteLine(@"(C) Proton-Electrotex JSC, 2011-2021" + Environment.NewLine);

            using (var dialog = new DialogEngine())
                dialog.Run();
        }
    }
}
