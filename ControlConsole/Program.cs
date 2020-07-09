using System;

namespace PE.ControlConsole
{
    internal static class Program
    {
        private static void Main()
        {
            Console.WriteLine(Environment.NewLine + @" SCCI protocol script console, v1.8");
            Console.WriteLine(@" (C) Proton-Electrotex JSC, 2011-2019");

            using (var dialog = new DialogEngine())
                dialog.Run();
        }
    }
}
