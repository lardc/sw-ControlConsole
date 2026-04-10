using System;
using System.Collections.Generic;
using System.Drawing.Printing;
using System.Linq;
using System.Runtime.Remoting.Contexts;
using System.Text;
using System.Threading.Tasks;

namespace PE.ControlConsole
{
    internal class AutoCompletionHandler : IAutoCompleteHandler
    {
        public char[] Separators { get; set; } = new char[] { ' ', '.', '/', '(', '{' };

        private string[] FunctionList;

        public void SetFunctionList(string[] functionList) { this.FunctionList = functionList; }

        public string[] GetSuggestions(string text, int index)
        {
            string[] suggestions;

            if (text.StartsWith("cfg."))
                suggestions = new string[] { "LoadProfile(" };
            else if (text.StartsWith("dev."))
                suggestions = new string[]
                {
                    "Connect(", "co(",
                    "Disconnect()", "dco(",
                    "SendString(", "ss(",
                    "SendStringWithReply(", "sswr(",
                    "GetNodeID()",
                    "SetNodeID(", "nid(",
                    "Write16Silent(",
                    "Write16(", "w(",
                    "Write16S(", "ws(",
                    "Write32(", "Write32S(",
                    "WriteFloat(", "wf(",
                    "Read16Silent(",
                    "Read16(", "r(",
                    "Read16S(", "rs(",
                    "Read32(", "Read32S(",
                    "ReadFloatSilent(",
                    "ReadFloat(", "rf(",
                    "ReadLimitFloatLow(", "rlfl(",
                    "ReadLimitFloatHigh(", "rlfh(",
                    "ReadArray16(", "ra(",
                    "ReadArray16S(", "ras(",
                    "ReadArray32(", "rla(",
                    "ReadArray32S(", "rlas(",
                    "WriteArray16(", "wa(",
                    "WriteArray16S(", "was(",
                    "WriteArray32(", "WriteArray32S(",
                    "Call(", "c(",
                    "ReadArrayFast16(", "raf(",
                    "ReadArrayFast16S(", "rafs(",
                    "ReadArrayFastFloat(", "raff(",
                    "Dump(",
                    "Restore("
                };
            else if (text.StartsWith("tmc."))
                suggestions = new string[]
                {
                    "list()",
                    "co()",
                    "dco()",
                    "q(",
                    "w(",
                    "r()"
                };
            else if (text.StartsWith("include(") || text.StartsWith("i("))
            {
                suggestions = new string[0];
                var includePaths = Properties.Settings.Default.IncludePath
                    .Split(new[] { ';' }, StringSplitOptions.RemoveEmptyEntries);

                var scriptPaths = new List<string>();
                foreach (var path in includePaths)
                {
                    try
                    {
                        if (System.IO.Directory.Exists(path))
                        {
                            scriptPaths.AddRange(System.IO.Directory.GetFiles(path, "*.js")
                                .Select(file => $"\"{file.Substring(file.LastIndexOf('\\') + 1)}\");"));
                        }
                    }
                    catch
                    {
                        // Do nothing if path not found or inaccessible
                    }
                }
                suggestions = scriptPaths.ToArray();

            }
            else
            {
                suggestions = new string[]
                {
                    "help()",
                    "cls()",
                    "closew()",
                    "exec(",
                    "print(",
                    "pinline(",
                    "sleep(",
                    "save(",
                    "append(",
                    "load(",
                    "loadtihex(",
                    "loadbin(",
                    "include(",
                    "plot(",
                    "plotn(",
                    "plot2(",
                    "plot2s(",
                    "plot3(",
                    "plotXY(",
                    "scatter(",
                    "scattern(",
                    "reset(",
                    "uint(",
                    "portlist()",
                    "pp()",
                    "tmc_list()",
                    "anykey()",
                    "readkey()",
                    "readline()",
                    "create(",
                    "create1(",
                    "create2(",
                    "loadlib(",
                    "quit()",
                    "cfg",
                    "dev",
                    "tmc",
                    "cin",
                    "cout",
                    "cerr"
                };

                if (FunctionList != null && FunctionList.Length > 0)
                    suggestions = suggestions.Concat(FunctionList).ToArray();
            }

            var lastWord = text.Split(Separators).LastOrDefault() ?? text;
            if (!string.IsNullOrEmpty(lastWord))
            {
                suggestions = suggestions
                    .Where(s => s.StartsWith(lastWord, StringComparison.OrdinalIgnoreCase))
                    .ToArray();
            }

            return suggestions;
        }
    }
}
