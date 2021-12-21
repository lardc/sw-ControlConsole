using System;
using System.Collections.Generic;
using System.Drawing;
using System.Threading;
using System.Windows.Forms;
using ZedGraph;

namespace PE.ControlConsole.Forms
{
    internal partial class PlotForm : Form
    {
        private static List<Thread> ThreadList = new List<Thread>();
        private static int ms_PlotCounter = 1;
        private static readonly Color[] ms_Colors = {Color.Blue, Color.Red, Color.Green, Color.Orange};

        internal static void RunPlot(IEnumerable<double> YValues, double Step, double InitX)
        {
            RunPlotInternal(() => new PlotForm(YValues, Step, InitX));
        }

        internal static void RunPlot(IList<double> YValues1, IList<double> YValues2, double Step, double InitX)
        {
            RunPlotInternal(() => new PlotForm(YValues1, YValues2, Step, InitX));
        }

        internal static void RunPlotSame(IList<double> YValues1, IList<double> YValues2, double Step, double InitX)
        {
            RunPlotInternal(() => new PlotForm(YValues1, YValues2, Step, InitX, false));
        }

        internal static void RunPlot(IList<double> YValues1, IList<double> YValues2, IList<double> YValues3, double Step, double InitX)
        {
            RunPlotInternal(() => new PlotForm(YValues1, YValues2, YValues3, Step, InitX));
        }

        internal static void RunPlot(IList<double> XValues, IList<double> YValues)
        {
            RunPlotInternal(() => new PlotForm(XValues, YValues));
        }

        internal static void RunPlot(IList<double> XValues, IList<double> YValues, bool Scatter)
        {
            RunPlotInternal(() => new PlotForm(XValues, YValues, Scatter));
        }

        internal static void RunPlot(IList<double> XValues, IList<double> YValues, bool Scatter, string XName, string YName, string PlotName)
        {
            RunPlotInternal(() => new PlotForm(XValues, YValues, Scatter, XName, YName, PlotName));
        }

        private static void RunPlotInternal(Func<Form> FormFactory)
        {
            var plotFormThread = new Thread(Dummy =>
                                                {
                                                    Application.ThreadException +=
                                                        (Sender, E) => Console.WriteLine(E.Exception.Message);
                                                    Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);

                                                    Application.Run(FormFactory());
                                                }
                );

            plotFormThread.SetApartmentState(ApartmentState.STA);
            plotFormThread.Start();
            ThreadList.Add(plotFormThread);
        }

        internal static void ClosePlotWindows()
        {
            foreach (Thread thread in ThreadList)
                thread.Abort();

            ThreadList.Clear();
            ms_PlotCounter = 1;
        }

        private PlotForm(int CurvesNum, bool Scatter, bool SeparateAxes)
        {
            InitializeComponent();

            AdjustGraph(CurvesNum, Scatter, SeparateAxes);
            SetName(ms_PlotCounter);
            ms_PlotCounter++;
        }

        private PlotForm(IEnumerable<double> YValues, double Step, double InitX)
            : this(1, false, true)
        {
            PlotData(YValues, Step, InitX);
        }

        private PlotForm(IList<double> YValues1, IList<double> YValues2, double Step, double InitX)
            : this(2, false, true)
        {
            PlotData(YValues1, YValues2, Step, InitX);
        }

        private PlotForm(IList<double> YValues1, IList<double> YValues2, double Step, double InitX, bool dummy)
            : this(2, false, false)
        {
            PlotData(YValues1, YValues2, Step, InitX);
        }

        private PlotForm(IList<double> YValues1, IList<double> YValues2, IList<double> YValues3, double Step, double InitX)
            : this(3, false, true)
        {
            PlotData(YValues1, YValues2, YValues3, Step, InitX);
        }

        private PlotForm(IList<double> XValues, IList<double> YValues)
            : this(1, false, true)
        {
            PlotData(XValues, YValues);
        }

        private PlotForm(IList<double> XValues, IList<double> YValues, bool Scatter)
            : this(1, true, true)
        {
            PlotData(XValues, YValues);
        }

        private PlotForm(IList<double> XValues, IList<double> YValues, bool Scatter, string XName, string YName, string PlotName)
            : this(1, true, true)
        {
            OverrideNames(XName, YName, PlotName);
            PlotData(XValues, YValues);
        }
        
        private void SetName(int PlotNumber)
        {
            zedGraph.GraphPane.Title.Text = "Plot " + PlotNumber;
        }

        private void OverrideNames(string XName, string YName, string PlotName)
        {
            zedGraph.GraphPane.XAxis.Title.Text = XName;
            zedGraph.GraphPane.YAxis.Title.Text = YName;
            zedGraph.GraphPane.Title.Text = zedGraph.GraphPane.Title.Text + " [" + PlotName + "]";
        }

        private void PlotData(IEnumerable<double> YValues, double Step, double InitX)
        {
            var curve = zedGraph.GraphPane.CurveList[0];
            var counter = InitX;

            foreach (var t in YValues)
            {
                curve.AddPoint(counter, t);
                counter += Step;
            }

            zedGraph.GraphPane.AxisChange();
            zedGraph.Refresh();
        }

        private void PlotData(IList<double> YValues1, IList<double> YValues2, double Step, double InitX)
        {
            var curve1 = zedGraph.GraphPane.CurveList[0];
            var curve2 = zedGraph.GraphPane.CurveList[1];
            var counter = InitX;

            for (var i = 0; i < YValues1.Count || i < YValues2.Count; ++i)
            {
                if (i < YValues1.Count)
                    curve1.AddPoint(counter, YValues1[i]);
                if (i < YValues2.Count)
                    curve2.AddPoint(counter, YValues2[i]);

                counter += Step;
            }

            zedGraph.GraphPane.AxisChange();
            zedGraph.Refresh();
        }

        private void PlotData(IList<double> YValues1, IList<double> YValues2, IList<double> YValues3, double Step, double InitX)
        {
            var curve1 = zedGraph.GraphPane.CurveList[0];
            var curve2 = zedGraph.GraphPane.CurveList[1];
            var curve3 = zedGraph.GraphPane.CurveList[2];
            var counter = InitX;

            for (var i = 0; i < YValues1.Count || i < YValues2.Count; ++i)
            {
                if (i < YValues1.Count)
                    curve1.AddPoint(counter, YValues1[i]);
                if (i < YValues2.Count)
                    curve2.AddPoint(counter, YValues2[i]);
                if (i < YValues3.Count)
                    curve3.AddPoint(counter, YValues3[i]);

                counter += Step;
            }

            zedGraph.GraphPane.AxisChange();
            zedGraph.Refresh();
        }

        private void PlotData(IList<double> XValues, IList<double> YValues)
        {
            var curve = zedGraph.GraphPane.CurveList[0];

            for(var i = 0; i < YValues.Count && i < XValues.Count; ++i)
                curve.AddPoint(XValues[i], YValues[i]);

            zedGraph.GraphPane.AxisChange();
            zedGraph.Refresh();
        }

        private void AdjustGraph(int CurvesNum, bool Scatter, bool SeparateAxes)
        {
            var gpMain = zedGraph.GraphPane;

            // Main chart
            gpMain.Chart.Fill = new Fill(Color.FloralWhite, Color.LightGray, 0.4f);
            gpMain.Title.Text = "";
            gpMain.XAxis.Title.Text = "X axis";
            gpMain.YAxis.Title.Text = "Y axis";
            gpMain.XAxis.MajorGrid.IsVisible = true;
            // Make the Y axis scale blue
            gpMain.YAxis.Scale.FontSpec.FontColor = Color.Blue;
            gpMain.YAxis.Title.FontSpec.FontColor = Color.Blue;
            gpMain.Legend.IsVisible = false;

            LineItem Curve = zedGraph.GraphPane.AddCurve("DATA1", new PointPairList(), Color.Blue, Scatter ? SymbolType.Circle : SymbolType.None);
            if (Scatter)
            {
                Curve.Symbol.Border.Color = Color.DarkBlue;
                Curve.Line.IsVisible = false;
                Curve.Symbol.IsVisible = true;
                Curve.Symbol.Size = 8;
                Curve.Symbol.Border.Width = 2;
            }

            if (CurvesNum > 1)
            {
                LineItem Curve2 = zedGraph.GraphPane.AddCurve("DATA2", new PointPairList(), Color.Red, SymbolType.None);
                if (SeparateAxes)
                {
                    Curve2.YAxisIndex = gpMain.AddYAxis("Y2 axis");
                    // Make the Y2 axis scale red
                    gpMain.YAxisList[Curve2.YAxisIndex].Scale.FontSpec.FontColor = Color.Red;
                    gpMain.YAxisList[Curve2.YAxisIndex].Title.FontSpec.FontColor = Color.Red;
                }
            }
            
            if (CurvesNum > 2)
            {
                LineItem Curve3 = zedGraph.GraphPane.AddCurve("DATA3", new PointPairList(), Color.Green, SymbolType.None);
                if (SeparateAxes)
                {
                    Curve3.YAxisIndex = gpMain.AddYAxis("Y3 axis");
                    // Make the Y3 axis scale green
                    gpMain.YAxisList[Curve3.YAxisIndex].Scale.FontSpec.FontColor = Color.Green;
                    gpMain.YAxisList[Curve3.YAxisIndex].Title.FontSpec.FontColor = Color.Green;
                }
            }

            for (var i = 0; i < gpMain.YAxisList.Count; ++i)
            {
                // Turn off the opposite tics so the Y tics don't show up on the Y2 axis
                gpMain.YAxisList[i].MajorTic.IsOpposite = false;
                gpMain.YAxisList[i].MinorTic.IsOpposite = false;
                // Don't display the Y zero line
                gpMain.YAxisList[i].MajorGrid.IsZeroLine = false;
                // Align the Y axis labels so they are flush to the axis
                gpMain.YAxisList[i].Scale.Align = AlignP.Inside;
            }

            gpMain.YAxis.Scale.MaxAuto = true;
            gpMain.YAxis.Scale.MinAuto = true;
            gpMain.XAxis.Scale.MaxAuto = true;
            gpMain.XAxis.Scale.MinAuto = true;
        }
    }
}
