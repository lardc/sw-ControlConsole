namespace PE.ControlConsole.Forms
{
    internal partial class PlotForm
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.zedGraph = new ZedGraph.ZedGraphControl();
            this.SuspendLayout();
            // 
            // zedGraph
            // 
            this.zedGraph.Dock = System.Windows.Forms.DockStyle.Fill;
            this.zedGraph.EditModifierKeys = System.Windows.Forms.Keys.None;
            this.zedGraph.IsAntiAlias = true;
            this.zedGraph.IsAutoScrollRange = true;
            this.zedGraph.IsShowCopyMessage = false;
            this.zedGraph.IsShowPointValues = true;
            this.zedGraph.IsZoomOnMouseCenter = true;
            this.zedGraph.LinkModifierKeys = System.Windows.Forms.Keys.None;
            this.zedGraph.Location = new System.Drawing.Point(0, 0);
            this.zedGraph.Name = "zedGraph";
            this.zedGraph.PanButtons = System.Windows.Forms.MouseButtons.Middle;
            this.zedGraph.PanButtons2 = System.Windows.Forms.MouseButtons.None;
            this.zedGraph.PanModifierKeys = System.Windows.Forms.Keys.None;
            this.zedGraph.ScrollGrace = 0D;
            this.zedGraph.ScrollMaxX = 0D;
            this.zedGraph.ScrollMaxY = 0D;
            this.zedGraph.ScrollMaxY2 = 0D;
            this.zedGraph.ScrollMinX = 0D;
            this.zedGraph.ScrollMinY = 0D;
            this.zedGraph.ScrollMinY2 = 0D;
            this.zedGraph.SelectButtons = System.Windows.Forms.MouseButtons.None;
            this.zedGraph.SelectModifierKeys = System.Windows.Forms.Keys.None;
            this.zedGraph.Size = new System.Drawing.Size(573, 411);
            this.zedGraph.TabIndex = 0;
            // 
            // PlotForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(6F, 13F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(573, 411);
            this.Controls.Add(this.zedGraph);
            this.DoubleBuffered = true;
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.SizableToolWindow;
            this.MaximizeBox = false;
            this.MinimizeBox = false;
            this.Name = "PlotForm";
            this.ShowIcon = false;
            this.ShowInTaskbar = false;
            this.SizeGripStyle = System.Windows.Forms.SizeGripStyle.Show;
            this.Text = "Plot";
            this.ResumeLayout(false);

        }

        #endregion

        private ZedGraph.ZedGraphControl zedGraph;
    }
}