include("TestLSLH.js")
include("Tektronix.js")
include("CalGeneral.js")

// Calibration setup parameters
cal_Points = 10;

cal_Rshunt = 250;		// мкОм
cal_Rload = 1000;		// мкОм

cal_CurrentRange = 1;	// 0 = 100 - 1000A; 1 = 1000 - 6500A;

cal_UtmMin = 500;		// мВ
cal_UtmMax = 5000;		// мВ
cal_UtmStp = (cal_UtmMax - cal_UtmMin) / cal_Points;

cal_ItmMin = [100, 1001];	
cal_ItmMax = [1000, 6000];
cal_ItmStp = (cal_ItmMax[cal_CurrentRange] - cal_ItmMin[cal_CurrentRange]) / cal_Points;

cal_IsetMin = 100;	
cal_IsetMax = 6000;
cal_IsetStp = (cal_IsetMax - cal_IsetMin) / cal_Points;

cal_Iterations = 1;
cal_UseAvg = 1;
//		

// Counters
cal_CntTotal = 0;
cal_CntDone = 0;

// Channels
cal_chMeasureItm = 1;
cal_chMeasureUtm = 2;
cal_chSync = 3;

// Results storage
cal_Utm = [];
cal_Itm = [];
cal_Iset = [];

// Tektronix data
cal_UtmSc = [];
cal_ItmSc = [];
cal_IsetSc = [];

// Relative error
cal_UtmErr = [];
cal_ItmErr = [];
cal_IsetErr = [];

// Correction
cal_UtmCorr = [];
cal_ItmCorr = [];
cal_IsetCorr = [];

function CAL_Init(portDevice, portTek, channelMeasureItm, channelMeasureUtm, channelSync)
{
	if (channelMeasureItm < 1 || channelMeasureItm > 4)
	{
		print("Wrong channel numbers");
		return;
	}

	// Copy channel information
	cal_chMeasureUtm = channelMeasureUtm;
	cal_chMeasureItm = channelMeasureItm;
	cal_chSync = channelSync;

	// Init device port
	dev.Disconnect();
	dev.Connect(portDevice);

	// Init Tektronix port
	TEK_PortInit(portTek);
	
	// Tektronix init
	for (var i = 1; i <= 4; i++)
	{
		if ((i == cal_chMeasureUtm) || (i == channelMeasureItm) || (i == cal_chSync))
			TEK_ChannelOn(i);
		else
			TEK_ChannelOff(i);
	}
	TEK_ChannelInit(cal_chSync, "1", "1");
	LSL_TriggerInit(cal_chSync, "2");
	TEK_Horizontal("1e-3", "0");
}
//--------------------

function CAL_CalibrateUtm()
{
	CAL_ResetA();
	CAL_ResetUtmCal();
	
	OverShootCurrentReset();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureUtm);
	
	// Reload values
	var VoltageArray = CGEN_GetRange(cal_UtmMin, cal_UtmMax, cal_UtmStp);
	
	if (CAL_CollectUtm(VoltageArray, cal_Iterations))
	{
		CAL_SaveUtm("LSL_Utm");

		// Plot relative error distribution
		scattern(cal_UtmSc, cal_UtmErr, "Voltage (in mV)", "Error (in %)", "Voltage relative error");

		// Calculate correction
		cal_UtmCorr = CGEN_GetCorrection2("LSL_Utm");
		CAL_SetCoefUtm(cal_UtmCorr[0], cal_UtmCorr[1], cal_UtmCorr[2]);
		CAL_PrintCoefUtm();
	}
	
	OverShootCurrentRestore();
}
//--------------------

function CAL_CalibrateItm()
{		
	CAL_ResetA();
	CAL_ResetItmCal();
	
	OverShootCurrentReset();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureItm);

	// Reload values
	var CurrentArray = CGEN_GetRange(cal_ItmMin[cal_CurrentRange], cal_ItmMax[cal_CurrentRange], cal_ItmStp);

	if (CAL_CollectItm(CurrentArray, cal_Iterations))
	{
		CAL_SaveItm("LSL_Itm");

		// Plot relative error distribution
		scattern(cal_ItmSc, cal_ItmErr, "Current (in A)", "Error (in %)", "Current relative error");

		// Calculate correction
		cal_ItmCorr = CGEN_GetCorrection2("LSL_Itm");
		CAL_SetCoefItm(cal_ItmCorr[0], cal_ItmCorr[1], cal_ItmCorr[2]);
		CAL_PrintCoefItm();
	}
	
	OverShootCurrentRestore();
}
//--------------------

function CAL_CalibrateIset()
{		
	CAL_ResetA();
	CAL_ResetIsetCal();
	
	OverShootCurrentReset();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureItm);

	// Reload values
	var CurrentArray = CGEN_GetRange(cal_IsetMin, cal_IsetMax, cal_IsetStp);

	if (CAL_CollectIset(CurrentArray, cal_Iterations))
	{
		CAL_SaveIset("LSL_Iset");

		// Plot relative error distribution
		scattern(cal_IsetSc, cal_IsetErr, "Current (in A)", "Error (in %)", "Current set relative error");

		// Calculate correction
		cal_IsetCorr = CGEN_GetCorrection2("LSL_Iset");
		CAL_SetCoefIset(cal_IsetCorr[0], cal_IsetCorr[1], cal_IsetCorr[2]);
		CAL_PrintCoefIset();
	}
	
	OverShootCurrentRestore();
}
//--------------------

function CAL_VerifyUtm()
{
	CAL_ResetA();
	
	OverShootCurrentReset();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureUtm);
	
	// Reload values
	var VoltageArray = CGEN_GetRange(cal_UtmMin, cal_UtmMax, cal_UtmStp);

	if (CAL_CollectUtm(VoltageArray, cal_Iterations))
	{
		CAL_SaveUtm("LSL_Utm_fixed");

		// Plot relative error distribution
		scattern(cal_UtmSc, cal_UtmErr, "Voltage (in mV)", "Error (in %)", "Voltage relative error");
	}
	
	OverShootCurrentRestore();
}
//--------------------

function CAL_VerifyItm()
{		
	CAL_ResetA();
	
	OverShootCurrentReset();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureItm);

	// Reload values
	var CurrentArray = CGEN_GetRange(cal_ItmMin[cal_CurrentRange], cal_ItmMax[cal_CurrentRange], cal_ItmStp);

	if (CAL_CollectItm(CurrentArray, cal_Iterations))
	{
		CAL_SaveItm("LSL_Itm_fixed");

		// Plot relative error distribution
		scattern(cal_ItmSc, cal_ItmErr, "Current (in A)", "Error (in %)", "Current relative error");
	}
	
	OverShootCurrentRestore();
}
//--------------------

function CAL_VerifyIset()
{		
	CAL_ResetA();
	
	OverShootCurrentReset();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureItm);

	// Reload values
	var CurrentArray = CGEN_GetRange(cal_IsetMin, cal_IsetMax, cal_IsetStp);

	if (CAL_CollectIset(CurrentArray, cal_Iterations))
	{
		CAL_SaveIset("LSL_Iset_fixed");

		// Plot relative error distribution
		scattern(cal_IsetSc, cal_IsetErr, "Current (in A)", "Error (in %)", "Current set relative error");
	}
	
	OverShootCurrentRestore();
}
//--------------------

function CAL_CollectUtm(VoltageValues, IterationsCount)
{
	cal_CntTotal = IterationsCount * VoltageValues.length;
	cal_CntDone = 1;

	var AvgNum;
	if (cal_UseAvg)
	{
		AvgNum = 4;
		TEK_AcquireAvg(AvgNum);
	}
	else
	{
		AvgNum = 1;
		TEK_AcquireSample();
	}
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < VoltageValues.length; j++)
		{
			print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --");
			//
			
			LSL_TekScale(cal_chMeasureUtm, VoltageValues[j] / 1000);
			LSL_TriggerInit(cal_chSync)
			
			var PrintTemp = LSLH_Print;
			LSLH_Print = 0;
			
			for (var k = 0; k < AvgNum; k++)
			{
				if(!LSLH_StartMeasure(VoltageValues[j] / cal_Rload * 1000))
					return 0;
			}
			
			LSLH_Print = PrintTemp;
			
			// Unit data
			var UtmRead = dev.r(198);
			cal_Utm.push(UtmRead);
			print("Utmread, mV: " + UtmRead);

			// Scope data
			var UtmSc = CAL_Measure(cal_chMeasureUtm).toFixed(3) * 1000;
			cal_UtmSc.push(UtmSc);
			print("Utmtek,  mV: " + UtmSc);

			// Relative error
			var UtmErr = ((UtmRead - UtmSc) / UtmSc * 100).toFixed(2);
			cal_UtmErr.push(UtmErr);
			print("Utmerr,  %: " + UtmErr);
			print("--------------------");
			
			if (anykey()) return 0;
		}
	}

	return 1;
}
//--------------------

function CAL_CollectItm(CurrentValues, IterationsCount)
{
	cal_CntTotal = IterationsCount * CurrentValues.length;
	cal_CntDone = 1;

	var AvgNum;
	if (cal_UseAvg)
	{
		AvgNum = 4;
		TEK_AcquireAvg(AvgNum);
	}
	else
	{
		AvgNum = 1;
		TEK_AcquireSample();
	}
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < CurrentValues.length; j++)
		{
			print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --");
			//
			LSL_TekScale(cal_chMeasureItm, CurrentValues[j] * cal_Rshunt / 1000000);
			LSL_TriggerInit(cal_chSync, 2);
			
			var PrintTemp = LSLH_Print;
			LSLH_Print = 0;
			
			for (var k = 0; k < AvgNum; k++)
			{
				if(!LSLH_StartMeasure(CurrentValues[j]))
					return 0;
			}
			
			LSLH_Print = PrintTemp;
			
			// Unit data
			var ItmRead = dev.r(206);
			cal_Itm.push(ItmRead);
			print("Itmread, A: " + ItmRead);

			// Scope data
			var ItmSc = (CAL_Measure(cal_chMeasureItm) / cal_Rshunt * 1000000).toFixed(2);
			cal_ItmSc.push(ItmSc);
			print("Itmtek, A: " + ItmSc);

			// Relative error
			var ItmErr = ((ItmRead - ItmSc) / ItmSc * 100).toFixed(2);
			cal_ItmErr.push(ItmErr);
			print("Itmerr, %: " + ItmErr);
			print("--------------------");
			
			if (anykey()) return 0;
		}
	}

	return 1;
}
//--------------------

function CAL_CollectIset(CurrentValues, IterationsCount)
{
	cal_CntTotal = IterationsCount * CurrentValues.length;
	cal_CntDone = 1;

	var AvgNum;
	if (cal_UseAvg)
	{
		AvgNum = 4;
		TEK_AcquireAvg(AvgNum);
	}
	else
	{
		AvgNum = 1;
		TEK_AcquireSample();
	}
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < CurrentValues.length; j++)
		{
			print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --");
			//
			LSL_TekScale(cal_chMeasureItm, CurrentValues[j] * cal_Rshunt / 1000000);
			LSL_TriggerInit(cal_chSync, 2);
			
			var PrintTemp = LSLH_Print;
			LSLH_Print = 0;
			
			for (var k = 0; k < AvgNum; k++)
			{
				if(!LSLH_StartMeasure(CurrentValues[j]))
					return 0;
			}
			
			LSLH_Print = PrintTemp;
			
			// Unit data
			var Iset = CurrentValues[j];
			cal_Iset.push(Iset);
			print("Iset, A: " + Iset);

			// Scope data
			var IsetSc = (CAL_Measure(cal_chMeasureItm) / cal_Rshunt * 1000000).toFixed(2);
			cal_IsetSc.push(IsetSc);
			print("Itmtek, A: " + IsetSc);

			// Relative error
			var IsetErr = ((Iset - IsetSc) / IsetSc * 100).toFixed(2);
			cal_IsetErr.push(IsetErr);
			print("Iseterr, %: " + IsetErr);
			print("--------------------");
			
			if (anykey()) return 0;
		}
	}

	return 1;
}
//--------------------

function LSL_TriggerInit(Channel)
{
	TEK_TriggerInit(cal_chSync, 2);
	TEK_Send("trigger:main:edge:slope fall");
	sleep(1000);
}
//--------------------

function LSL_TekScale(Channel, Value)
{
	Value = Value / 7;
	TEK_Send("ch" + Channel + ":scale " + Value);
}
//--------------------

function CAL_TekInit(Channel)
{
	TEK_ChannelInit(Channel, "1", "2");
	CAL_TekCursor(Channel);
}
//--------------------

function CAL_TekCursor(Channel)
{
	TEK_Send("cursor:select:source ch" + Channel);
	TEK_Send("cursor:function vbars");
	TEK_Send("cursor:vbars:position1 0");
	TEK_Send("cursor:vbars:position2 0");
}
//--------------------

function CAL_TekScale(Channel, Value)
{
	Value = Value / 6;
	TEK_Send("ch" + Channel + ":scale " + Value);
}
//--------------------

function CAL_Measure(Channel)
{
	TEK_Send("cursor:select:source ch" + Channel);
	sleep(500);

	var f = TEK_Exec("cursor:vbars:hpos2?");
	if (Math.abs(f) > 2.7e+8)
		f = 0;
	return parseFloat(f);
}
//--------------------

function CAL_ResetA()
{	
	// Results storage
	cal_Utm = [];
	cal_Itm = [];
	cal_Iset = [];

	// Tektronix data
	cal_UtmSc = [];
	cal_ItmSc = [];
	cal_IsetSc = [];

	// Relative error
	cal_UtmErr = [];
	cal_ItmErr = [];
	cal_IsetErr = [];

	// Correction
	cal_UtmCorr = [];
	cal_ItmCorr = [];
	cal_IsetCorr = [];
}
//--------------------

function CAL_SaveUtm(NameUtm)
{
	CGEN_SaveArrays(NameUtm, cal_Utm, cal_UtmSc, cal_UtmErr);
}
//--------------------

function CAL_SaveItm(NameItm)
{
	CGEN_SaveArrays(NameItm, cal_Itm, cal_ItmSc, cal_ItmErr);
}
//--------------------

function CAL_SaveIset(NameIset)
{
	CGEN_SaveArrays(NameIset, cal_IsetSc, cal_Iset, cal_IsetErr);
}
//--------------------

function CAL_ResetUtmCal()
{
	CAL_SetCoefUtm(0, 1, 0);
}
//--------------------

function CAL_ResetItmCal()
{
	CAL_SetCoefItm(0, 1, 0);
}
//--------------------

function CAL_ResetIsetCal()
{
	CAL_SetCoefItm(0, 1, 0);
}
//--------------------

function CAL_SetCoefUtm(P2, P1, P0)
{
	dev.ws(16, Math.round(P2 * 1e6));
	dev.w(15, Math.round(P1 * 1000));
	dev.ws(14, Math.round(P0));
}
//--------------------

function CAL_SetCoefIset(P2, P1, P0)
{
	dev.ws(43, Math.round(P2 * 1e6));
	dev.w(42, Math.round(P1 * 1000));
	dev.ws(41, Math.round(P0));
}
//--------------------

function CAL_SetCoefItm(P2, P1, P0)
{
	switch(cal_CurrentRange)
	{	
		case 0:
		{
			dev.ws(6, Math.round(P2 * 1e6));
			dev.w(5, Math.round(P1 * 1000));
			dev.ws(4, Math.round(P0));
		}
		break;
		
		case 1:
		{
			dev.ws(11, Math.round(P2 * 1e6));
			dev.w(10, Math.round(P1 * 1000));
			dev.ws(9, Math.round(P0));
		}
		break;
	}		
}
//--------------------

function CAL_PrintCoefUtm()
{
	print("Utm  P2 x1e6		: " + dev.rs(16));
	print("Utm  P1 x1000	: " + dev.rs(15));
	print("Utm  P0			: " + dev.rs(14));
}
//--------------------

function CAL_PrintCoefItm()
{
	switch(cal_CurrentRange)
	{
		case 0:
		{
			print("Itm 0 P2 x1e6	: " + dev.rs(6));
			print("Itm 0 P1 x1000	: " + dev.rs(5));
			print("Itm 0 P0			: " + dev.rs(4));
		}
		break;
		
		case 1:
		{
			print("Itm 1 P2 x1e6	: " + dev.rs(11));
			print("Itm 1 P1 x1000	: " + dev.rs(10));
			print("Itm 1 P0			: " + dev.rs(9));
		}
		break;
	}
}
//--------------------

function CAL_PrintCoefIset()
{
	print("Itm 1 P2 x1e6	: " + dev.rs(43));
	print("Itm 1 P1 x1000	: " + dev.rs(42));
	print("Itm 1 P0			: " + dev.rs(41));
}
//--------------------

var OvershootCurrent;

function OverShootCurrentReset()
{
	OvershootCurrent = dev.r(40);
	dev.w(40, 0);
}
//--------------------

function OverShootCurrentRestore()
{
	dev.w(40, OvershootCurrent);
}

