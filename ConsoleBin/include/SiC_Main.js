include("SiC_Calc.js")

sic_diag_plot = true;

function SiC_Plot(Data)
{
	plot3(Data.Vge, Data.Vce, Data.Ice, 1, 0);
}

function SiC_PrintRF(Data)
{
	print("S_max:\t"  + Data.S_max.toFixed(1));
	print("S_amp:\t"  + Data.S_amp.toFixed(1));
	print("S_rf:\t"   + Data.S_rf.toFixed(0));
	print("t_rf:\t"   + Data.t_rf.toFixed(1));
	print("t_min:\t"  + Data.t_min);
	print("t_max:\t"  + Data.t_max);
}

function SiC_Main(Curves, FileName)
{
	var Mode = SiC_CALC_OnMode(Curves);
	var RiseFallData = SiC_CALC_VI_RiseFall(Curves);
	
	var out_data = [];
	
	out_data.push("V" + ":\t\t" + RiseFallData.V_points.S_amp.toFixed(0) + "\t (V)");
	out_data.push("Vmax" + ":\t\t" + RiseFallData.V_points.S_max.toFixed(0) + "\t (V)");
	out_data.push("---");
	out_data.push("I" + ":\t\t" + RiseFallData.I_points.S_amp.toFixed(0) + "\t (A)");
	out_data.push("Imax" + ":\t\t" + RiseFallData.I_points.S_max.toFixed(0) + "\t (A)");
	out_data.push("---");
	out_data.push("dI/dt_" + (Mode ? "on" : "off") + ":\t" + RiseFallData.I_points.S_rf.toFixed(0) + "\t (A/us)");
	out_data.push("t" + (Mode ? "r" : "f") + "i:\t\t" + RiseFallData.I_points.t_rf.toFixed(0) + "\t (ns)");
	out_data.push("tdi_" + (Mode ? "on: " : "off:") + "\t" + SiC_CALC_Delay(Curves).toFixed(0) + "\t (ns)");
	out_data.push("---");
	out_data.push("dU/dt_" + (Mode ? "on" : "off") + ":\t" + RiseFallData.V_points.S_rf.toFixed(0) + "\t (V/us)");
	out_data.push("t" + (Mode ? "f" : "r") + "v:\t\t" + RiseFallData.V_points.t_rf.toFixed(0) + "\t (ns)");
	out_data.push("E_" + (Mode ? "on" : "off") + ":\t\t" + SiC_CALC_Energy(Curves).Energy.toFixed(0) + "\t (mJ)");
	
	if (Mode)
	{
		var Recovery = SiC_CALC_Recovery(Curves);
		
		out_data.push("---");
		out_data.push("Irrm" + ":\t\t" + Recovery.Irrm.toFixed(0) + "\t (A)");
		out_data.push("trr" + ":\t\t" + Recovery.trr.toFixed(0) + "\t (ns)");
		out_data.push("Qrr" + ":\t\t" + Recovery.Qrr.toFixed(0) + "\t (uC)");
		out_data.push("E_rec" + ":\t\t" + Recovery.Energy.toFixed(1) + "\t (mJ)");
	}
	
	for (var  i = 0; i < out_data.length; ++i)
		print(out_data[i]);
	
	if (FileName)
	{
		FileName += '_' + (new Date()).toISOString().slice(0, 19).replace(/[\-:]/g, '').replace('T', '_') + '.txt';
		save(FileName, out_data);
	}
}

function SiC_Start()
{
	dev.c(101);
	sleep(200);
	SiC_Main(SiC_GD_GetCurves(3, 2, 1));
}
