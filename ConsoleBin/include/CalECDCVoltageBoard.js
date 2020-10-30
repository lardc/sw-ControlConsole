include("TestECDCVoltageBoard.js")
include("Tektronix.js")
include("CalGeneral.js")

// Input params
cal_CurrentRangeLv = 0;
cal_VoltageRange = 0;
cal_CurrentRangeHv = 0;

cal_Rload = 1;		// Load resistance in Ohm
cal_Rshunt = 1;		// Shunt resistance in Ohm

// Hardware definitions
cal_CurrentRangeLvArrayMin = [8, 80, 800, 8000];							// Min current values for ranges
cal_CurrentRangeLvArrayMax = [100, 1000, 10000, 110000];					// Max current values for ranges
cal_CurrentRangeHvArrayMin = [8, 80, 800, 8000];							// Min current values for ranges
cal_CurrentRangeHvArrayMax = [100, 1000, 10000, 110000];					// Max current values for ranges
cal_VoltageRangeArrayMin = [40, 180, 1800, 18000];							// Min voltage values for ranges
cal_VoltageRangeArrayMax = [200, 2000, 20000, 270000];						// Max voltage values for ranges

// Counters
cal_CntTotal = 0;
cal_CntDone = 0;

cal_UseAvg = 1;

// Channels
cal_chMeasureId = 1;
cal_chMeasureUd = 2;

// Results storage
cal_Ud = [];
cal_Idlv = [];
cal_Idhv = [];

// Tektronix data
cal_UdSc = [];
cal_IdlvSc = [];
cal_IdhvSc = [];

// Relative error
cal_UdErr = [];
cal_IdlvErr = [];
cal_IdhvErr = [];

// Correction
cal_UdCorr = [];
cal_IdlvCorr = [];
cal_IdhvCorr = [];

function CAL_Init(portDevice, portTek, channelMeasureId, channelMeasureUd)
{
	if (channelMeasureId < 1 || channelMeasureId > 4)
	{
		print("Wrong channel numbers");
		return;
	}

	// Copy channel information
	cal_chMeasureUd = channelMeasureUd;
	cal_chMeasureId = channelMeasureId;

	// Init device port
	dev.Disconnect();
	dev.Connect(portDevice);

	// Init Tektronix port
	TEK_PortInit(portTek);
}

function CAL_TekInit(Channel)
{
	// Init channels
	TEK_ChannelInit(Channel, "1", "1");
	TEK_ChannelScale(Channel, "1");
	// Init trigger
	TEK_TriggerPulseInit(Channel, "2");
	// Horizontal settings
	TEK_Horizontal("2.5e-3", "0");
	
	CAL_TekCursor(Channel);
}


function CAL_TekCursor(Channel)
{
	TEK_Send("cursor:select:source ch" + Channel);
	TEK_Send("cursor:function vbars");
	TEK_Send("cursor:vbars:position1 5e-3");
	TEK_Send("cursor:vbars:position2 9e-3");
}

function CAL_TekScale(Channel, Value)
{
	Value = Value / 6;
	TEK_Send("ch" + Channel + ":scale " + Value);
}

function CAL_Measure(Channel, Resolution)
{
	TEK_Send("cursor:select:source ch" + Channel);
	sleep(500);

	var f = TEK_Exec("cursor:vbars:hpos2?");
	if (Math.abs(f) > 2.7e+8)
		f = 0;
	return parseFloat(f).toFixed(Resolution);
}

function CAL_CalibrateIdLv()
{	
	// Collect data
	var IdMin = cal_CurrentRangeLvArrayMin[cal_CurrentRangeLv];
	var IdMax = cal_CurrentRangeLvArrayMax[cal_CurrentRangeLv];
	var IdStp = 10
		
	CAL_ResetA();
	CAL_ResetIdLvCal();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureId);

	// Reload values
	var CurrentArray = CGEN_GetRange(IdMin, IdMax, IdStp);

	if (CAL_IdLvCollect(CurrentArray, cal_Iterations))
	{
		CAL_SaveIdLv("ECDCVoltageBoard_idlv");

		// Plot relative error distribution
		scattern(cal_IdlvSc, cal_IdlvErr, "Current (in uA)", "Error (in %)", "Current relative error");

		// Calculate correction
		cal_IdlvCorr = CGEN_GetCorrection2("ECDCVoltageBoard_idlv");
		CAL_SetCoefIdLv(cal_IdlvCorr[0], cal_IdlvCorr[1], cal_IdlvCorr[2]);
		CAL_PrintCoefIdLv();
	}
}

function CAL_CalibrateUd()
{	
	// Collect data
	var UdMin = cal_VoltageRangeArrayMin[cal_VoltageRange];
	var UdMax = cal_VoltageRangeArrayMax[cal_VoltageRange];
	var UdStp = 10
		
	CAL_ResetA();
	CAL_ResetUdCal();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureUd);

	// Reload values
	var VoltageArray = CGEN_GetRange(UdMin, UdMax, UdStp);

	if (CAL_UdCollect(VoltageArray, cal_Iterations))
	{
		CAL_SaveUd("ECDCVoltageBoard_ud");

		// Plot relative error distribution
		scattern(cal_UdSc, cal_UdErr, "Voltage (in uV)", "Error (in %)", "Voltage relative error");

		// Calculate correction
		cal_UdCorr = CGEN_GetCorrection2("ECDCVoltageBoard_ud");
		CAL_SetCoefUd(cal_UdCorr[0], cal_UdCorr[1], cal_UdCorr[2]);
		CAL_PrintCoefUd();
	}
}

function CAL_CalibrateIdHv()
{	
	// Collect data
	var IdMin = cal_CurrentRangeHvArrayMin[cal_CurrentRangeHv];
	var IdMax = cal_CurrentRangeHvArrayMax[cal_CurrentRangeHv];
	var IdStp = 10
		
	CAL_ResetA();
	CAL_ResetIdHvCal();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureId);
	
	// Reload values
	var CurrentArray = CGEN_GetRange(IdMin, IdMax, IdStp);

	if (CAL_IdHvCollect(CurrentArray, cal_Iterations))
	{
		CAL_SaveIdHv("ECDCVoltageBoard_idhv");

		// Plot relative error distribution
		scattern(cal_IdhvSc, cal_IdhvErr, "Current (in uA)", "Error (in %)", "Current relative error");

		// Calculate correction
		cal_IdhvCorr = CGEN_GetCorrection2("ECDCVoltageBoard_idhv");
		CAL_SetCoefIdhv(cal_IdhvCorr[0], cal_IdhvCorr[1], cal_IdhvCorr[2]);
		CAL_PrintCoefIdHv();
	}
}

function CAL_VerifyIdLv()
{	
	// Collect data
	var IdMin = cal_CurrentRangeLvArrayMin[cal_CurrentRangeLv];
	var IdMax = cal_CurrentRangeLvArrayMax[cal_CurrentRangeLv];
	var IdStp = 10
		
	CAL_ResetA();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureId);

	// Reload values
	var CurrentArray = CGEN_GetRange(IdMin, IdMax, IdStp);

	if (CAL_IdLvCollect(CurrentArray, cal_Iterations))
	{
		CAL_SaveIdLv("ECDCVoltageBoard_idlv_fixed");

		// Plot relative error distribution
		scattern(cal_IdlvSc, cal_IdlvErr, "Current (in uA)", "Error (in %)", "Current relative error");
	}
	
}

function CAL_VerifyUd()
{	
	// Collect data
	var UdMin = cal_VoltageRangeArrayMin[cal_VoltageRange];
	var UdMax = cal_VoltageRangeArrayMax[cal_VoltageRange];
	var UdStp = 10
	
	CAL_ResetA();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureUd);
	
	// Reload values
	var VoltageArray = CGEN_GetRange(UdMin, UdMax, UdStp);

	if (CAL_UdCollect(VoltageArray, cal_Iterations))
	{
		CAL_SaveUd("ECDCVoltageBoard_ud_fixed");

		// Plot relative error distribution
		scattern(cal_UdSc, cal_UdErr, "Voltage (in V)", "Error (in %)", "Voltage relative error");
	}
}

function CAL_VerifyIdHv()
{	
	// Collect data
	var IdMin = cal_CurrentRangeHvArrayMin[cal_CurrentRangeHv];
	var IdMax = cal_CurrentRangeHvArrayMax[cal_CurrentRangeHv];
	var IdStp = 10
		
	CAL_ResetA();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureId);

	// Reload values
	var CurrentArray = CGEN_GetRange(IdMin, IdMax, IdStp);

	if (CAL_IdHvCollect(CurrentArray, cal_Iterations))
	{
		CAL_SaveIdHv("ECDCVoltageBoard_idhv_fixed");

		// Plot relative error distribution
		scattern(cal_IdhvSc, cal_IdhvErr, "Current (in uA)", "Error (in %)", "Current relative error");
	}
}

function CAL_IdLvCollect(CurrentValues, IterationsCount)
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
	TEK_TriggerPulseInit(cal_chMeasureId, "2");
	sleep(1000);
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < CurrentValues.length; j++)
		{
			print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --");
			//
			CAL_TekScale(cal_chMeasureId, CurrentValues[j]* cal_Rload / 1000);
			TEK_TriggerLevelF((CurrentValues[j]* cal_Rload / 1000) / 2);
			sleep(1500);

			//
			var cal_print_copy = ECDC_VB_Print;
			ECDC_VB_Print = 0;
			
			for (var k = 0; k < AvgNum; k++)
			{
				ECDC_VB_Measure(CurrentValues[j]* cal_Rload / 1000, CurrentValues[j]);
				sleep(1000);
			}
			
			ECDC_VB_Print = cal_print_copy;
			
			// Unit data
			var IdRead = r32(200);
			cal_Idlv.push(IdRead);
			print("Idread, uA: " + IdRead);

			// Scope data
			var IdSc = (CAL_Measure(cal_chMeasureId) / cal_Rshunt * 1000000).toFixed(2);
			cal_IdlvSc.push(IdSc);
			print("Idtek, uA: " + IdSc);

			// Relative error
			var IdErr = ((IdRead - IdSc) / IdSc * 100).toFixed(2);
			cal_IdlvErr.push(IdErr);
			print("Iderr, %: " + IdErr);
			print("--------------------");
			
			if (anykey()) return 0;
		}
	}
}

function CAL_UdCollect(VoltageValues, IterationsCount)
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
	TEK_TriggerPulseInit(cal_chMeasureUd, "2");
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < VoltageValues.length; j++)
		{
			print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --");
			//
			CAL_TekScale(cal_chMeasureUd, VoltageValues[j]/1000);
			TEK_TriggerLevelF((VoltageValues[j] / 1000) / 2);
			sleep(1500);

			//
			var cal_print_copy = ECDC_VB_Print;
			ECDC_VB_Print = 0;
			
			for (var k = 0; k < AvgNum; k++)
			{
				ECDC_VB_Measure(VoltageValues[j], VoltageValues[j] / cal_Rload * 1000);
				sleep(1000);
			}
			
			ECDC_VB_Print = cal_print_copy;
			
			// Unit data
			var UdRead = r32(202);
			cal_Ud.push(UdRead);
			print("Udread, mV: " + UdRead);

			// Scope data
			var UdSc = (CAL_Measure(cal_chMeasureUd)).toFixed(2);
			cal_UdSc.push(UdSc);
			print("Udtek, mV: " + UdSc);

			// Relative error
			var UdErr = ((UdRead - UdSc) / UdSc * 100).toFixed(2);
			cal_UdErr.push(UdErr);
			print("Uderr, %: " + UdErr);
			print("--------------------");
			
			if (anykey()) return 0;
		}
	}	
}

function CAL_IdHvCollect(CurrentValues, IterationsCount)
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
	TEK_TriggerPulseInit(cal_chMeasureId, "2");
	sleep(1000);
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < CurrentValues.length; j++)
		{
			print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --");
			//
			CAL_TekScale(cal_chMeasureId, CurrentValues[j]* cal_Rload / 1000);
			TEK_TriggerLevelF((CurrentValues[j]* cal_Rload / 1000) / 2);
			sleep(1500);

			//
			var cal_print_copy = ECDC_VB_Print;
			ECDC_VB_Print = 0;
			
			for (var k = 0; k < AvgNum; k++)
			{
				ECDC_VB_Measure(CurrentValues[j]* cal_Rload / 1000, CurrentValues[j]);
				sleep(1000);
			}
			
			ECDC_VB_Print = cal_print_copy;
			
			// Unit data
			var IdRead = r32(200);
			cal_Idhv.push(IdRead);
			print("Idread, uA: " + IdRead);

			// Scope data
			var IdSc = (CAL_Measure(cal_chMeasureId) / cal_Rshunt * 1000000).toFixed(2);
			cal_IdhvSc.push(IdSc);
			print("Idtek, uA: " + IdSc);

			// Relative error
			var IdErr = ((IdRead - IdSc) / IdSc * 100).toFixed(2);
			cal_IddvErr.push(IdErr);
			print("Iderr, %: " + IdErr);
			print("--------------------");
			
			if (anykey()) return 0;
		}
	}
}

function CAL_ResetA()
{	
	// Results storage
	cal_Ud = [];
	cal_Idlv = [];
	cal_Idhv = [];

	// Tektronix data
	cal_UdSc = [];
	cal_IdlvSc = [];
	cal_IdhvSc = [];

	// Relative error
	cal_UdErr = [];
	cal_IdlvErr = [];
	cal_IdhvErr = [];

	// Correction
	cal_UdCorr = [];
	cal_IdlvCorr = [];
	cal_IdhvCorr = [];
}

function CAL_SaveIdLv(NameIdLv)
{
	CGEN_SaveArrays(NameIdlv, cal_Idlv, cal_IdlvSc, cal_IdlvErr);
}

function CAL_SaveUd(NameUd)
{
	CGEN_SaveArrays(NameIdhv, cal_Ud, cal_UdSc, cal_UdErr);
}

function CAL_SaveIdHv(NameIdHv)
{
	CGEN_SaveArrays(NameIdhv, cal_Idhv, cal_IdhvSc, cal_IdhvErr);
}

function CAL_SetCoefIdLv(P2, P1, P0)
{
		switch(cal_CurrentRangeLv)
	{	
		case 0:
		{
			dev.ws(42, Math.round(P0));
			dev.w(41, Math.round(P1 * 1000));
			dev.ws(40, Math.round(P2 * 1e6))
		}
		break;
		
		case 1:
		{
			dev.ws(48, Math.round(P0));
			dev.w(47, Math.round(P1 * 1000));
			dev.ws(46, Math.round(P2 * 1e6))
		}
		break;
		
		case 2:
		{
			dev.ws(54, Math.round(P0));
			dev.w(53, Math.round(P1 * 1000));
			dev.ws(52, Math.round(P2 * 1e6))
		}
		break;
		
		case 3:
		{
			dev.ws(60, Math.round(P0));
			dev.w(59, Math.round(P1 * 1000));
			dev.ws(58, Math.round(P2 * 1e6))
		}
		break;		
}

function CAL_SetCoefUd(P2, P1, P0)
{
		switch(cal_VoltageRange)
	{	
		case 0:
		{
			dev.ws(66, Math.round(P0));
			dev.w(65, Math.round(P1 * 1000));
			dev.ws(64, Math.round(P2 * 1e6))
		}
		break;
		
		case 1:
		{
			dev.ws(72, Math.round(P0));
			dev.w(71, Math.round(P1 * 1000));
			dev.ws(70, Math.round(P2 * 1e6))
		}
		break;
		
		case 2:
		{
			dev.ws(78, Math.round(P0));
			dev.w(77, Math.round(P1 * 1000));
			dev.ws(76, Math.round(P2 * 1e6))
		}
		break;
		
		case 3:
		{
			dev.ws(84, Math.round(P0));
			dev.w(83, Math.round(P1 * 1000));
			dev.ws(82, Math.round(P2 * 1e6))
		}
		break;		
}

function CAL_SetCoefIdHv(P2, P1, P0)
{
		switch(cal_CurrentRangeHv)
	{	
		case 0:
		{
			dev.ws(90, Math.round(P0));
			dev.w(89, Math.round(P1 * 1000));
			dev.ws(88, Math.round(P2 * 1e6))
		}
		break;
		
		case 1:
		{
			dev.ws(96, Math.round(P0));
			dev.w(95, Math.round(P1 * 1000));
			dev.ws(94, Math.round(P2 * 1e6))
		}
		break;
		
		case 2:
		{
			dev.ws(102, Math.round(P0));
			dev.w(101, Math.round(P1 * 1000));
			dev.ws(100, Math.round(P2 * 1e6))
		}
		break;
		
		case 3:
		{
			dev.ws(108, Math.round(P0));
			dev.w(107, Math.round(P1 * 1000));
			dev.ws(106, Math.round(P2 * 1e6))
		}
		break;		
}

function CAL_ResetIdLvCal()
{
	CAL_SetCoefIdLv(0, 1, 0);
}

function CAL_ResetUdCal()
{
	CAL_SetCoefUd(0, 1, 0);
}

function CAL_ResetIdHvCal()
{
	CAL_SetCoefIdHv(0, 1, 0);
}

function CAL_PrintCoefIdLv()
{
	switch(cal_CurrentRangeLv)
	{
		case 0:
		{
			print("Id 0 P0			: " + dev.rs(42));
			print("Id 0 P1 x1000	: " + dev.rs(41));
			print("Id 0 P2 x1e6		: " + dev.rs(40));
		}
		break;
		
		case 1:
		{
			print("Id 1 P0			: " + dev.rs(48));
			print("Id 1 P1 x1000	: " + dev.rs(47));
			print("Id 1 P2 x1e6		: " + dev.rs(46));
		}
		break;
		
		case 2:
		{
			print("Id 2 P0			: " + dev.rs(54));
			print("Id 2 P1 x1000	: " + dev.rs(53));
			print("Id 2 P2 x1e6		: " + dev.rs(52));
		}
		break;
		
		case 3:
		{
			print("Id 3 P0			: " + dev.rs(60));
			print("Id 3 P1 x1000	: " + dev.rs(59));
			print("Id 3 P2 x1e6		: " + dev.rs(58));
		}
		break;
}

function CAL_PrintCoefUd()
{
	switch(cal_VoltageRange)
	{
		case 0:
		{
			print("Id 0 P0			: " + dev.rs(66));
			print("Id 0 P1 x1000	: " + dev.rs(65));
			print("Id 0 P2 x1e6		: " + dev.rs(64));
		}
		break;
		
		case 1:
		{
			print("Id 1 P0			: " + dev.rs(72));
			print("Id 1 P1 x1000	: " + dev.rs(71));
			print("Id 1 P2 x1e6		: " + dev.rs(70));
		}
		break;
		
		case 2:
		{
			print("Id 2 P0			: " + dev.rs(78));
			print("Id 2 P1 x1000	: " + dev.rs(77));
			print("Id 2 P2 x1e6		: " + dev.rs(76));
		}
		break;
		
		case 3:
		{
			print("Id 3 P0			: " + dev.rs(84));
			print("Id 3 P1 x1000	: " + dev.rs(83));
			print("Id 3 P2 x1e6		: " + dev.rs(82));
		}
		break;
}

function CAL_PrintCoefIdHv()
{
	switch(cal_CurrentRangeHv)
	{
		case 0:
		{
			print("Id 0 P0			: " + dev.rs(90));
			print("Id 0 P1 x1000	: " + dev.rs(89));
			print("Id 0 P2 x1e6		: " + dev.rs(88));
		}
		break;
		
		case 1:
		{
			print("Id 1 P0			: " + dev.rs(96));
			print("Id 1 P1 x1000	: " + dev.rs(95));
			print("Id 1 P2 x1e6		: " + dev.rs(94));
		}
		break;
		
		case 2:
		{
			print("Id 2 P0			: " + dev.rs(102));
			print("Id 2 P1 x1000	: " + dev.rs(101));
			print("Id 2 P2 x1e6		: " + dev.rs(100));
		}
		break;
		
		case 3:
		{
			print("Id 3 P0			: " + dev.rs(108));
			print("Id 3 P1 x1000	: " + dev.rs(107));
			print("Id 3 P2 x1e6		: " + dev.rs(106));
		}
		break;
}
