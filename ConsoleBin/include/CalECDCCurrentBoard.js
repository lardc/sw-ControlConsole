include("TestECDCCurrentBoard.js")
include("Tektronix.js")
include("CalGeneral.js")

// Input params
cal_VoltageRange   = 0;		// 0 - 30mV, 1 - 250mV, 2 - 1.5V, 3 - 11V
cal_CurrentRange   = 0;		// 0 - 20mA, 1 - 200mA, 2 - 2A, 3 - 20A, 4 - 250A
cal_LoadResistance = 1;		// Load resistance in Ohm

// Hardware definitions
cal_CurrentRangeArray = [20, 200, 2e3, 2e4, 2.5e5];	// Maximum current values for ranges
cal_VoltageRangeArray = [30, 250, 1500, 11e3];		// Maximum voltage values for ranges

// Calibrate Id
cal_id_stp = 10;
cal_id_min = cal_CurrentRangeArray[cal_CurrentRange] / cal_id_stp;
cal_id_max = cal_CurrentRangeArray[cal_CurrentRange];
cal_ud_test = cal_VoltageRangeArray[3];

// Calibrate Ud
cal_ud_stp = 10;
cal_ud_min = cal_VoltageRangeArray[cal_VoltageRange] / cal_ud_stp;
cal_ud_max = cal_VoltageRangeArray[cal_VoltageRange];

// Counters
cal_cntTotal = 0;
cal_cntDone = 0;

// Iterations
cal_Iterations = 1;

// Channels
cal_chMeasureId = 1;
cal_chMeasureUd = 2;
cal_chSync 		= 3;

// Arrays
cal_id_array = [];
cal_ud_array = [];

// Results storage
cal_id = [];
cal_ud = [];

// Tektronix data
cal_id_sc = [];
cal_ud_sc = [];

// Relative error
cal_id_err = [];
cal_ud_err = [];

// Correction
cal_id_corr = [];
cal_ud_corr = [];

cal_UseAvg = 1;

function CAL_Init(portDevice, portTek, channelMeasureId, channelMeasureUd, channelSync)
{
	if (channelMeasureId < 1 || channelMeasureId > 4)
	{
		print("Wrong channel numbers");
		return;
	}

	// Copy channel information
	cal_chMeasureUd = channelMeasureUd;
	cal_chMeasureId = channelMeasureId;
	cal_chSync = channelSync;

	// Init device port
	dev.Disconnect();
	dev.Connect(portDevice);

	// Init Tektronix port
	TEK_PortInit(portTek);
}

function CAL_CalibrateId()
{	
	// Collect data
	CAL_ResetA();
	CAL_ResetIdCal();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureId);

	// Reload values
	var CurrentArray = CGEN_GetRange(cal_id_min, cal_id_max, cal_id_stp);

	if (CAL_IdCollect(CurrentArray, cal_Iterations))
	{
		CAL_SaveId("ECDCCurrentBoard_id");

		// Plot relative error distribution
		scattern(cal_id_sc, cal_id_err, "Current (in mA)", "Error (in %)", "Current relative error");

		// Calculate correction
		cal_id_corr = CGEN_GetCorrection2("ECDCCurrentBoard_id");
		CAL_SetCoefId(cal_id_corr[0], cal_id_corr[1], cal_id_corr[2]);
		CAL_PrintCoefId();
	}
}

function CAL_CalibrateUd()
{	
	// Collect data
	CAL_ResetA();
	CAL_ResetUdCal();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureUd);

	// Reload values
	var VoltageArray = CGEN_GetRange(cal_ud_min, cal_ud_max, cal_ud_stp);

	if (CAL_UdCollect(VoltageArray, cal_Iterations))
	{
		CAL_SaveUd("ECDCCurrentBoard_ud");

		// Plot relative error distribution
		scattern(cal_ud_sc, cal_ud_err, "Voltage (in mV)", "Error (in %)", "Voltage relative error");

		// Calculate correction
		cal_ud_corr = CGEN_GetCorrection2("ECDCCurrentBoard_ud");
		CAL_SetCoefUd(cal_ud_corr[0], cal_ud_corr[1], cal_ud_corr[2]);
		CAL_PrintCoefUd();
	}
}


function CAL_VerifyId()
{
	// Collect data
	CAL_ResetA();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureId);

	// Reload values
	var CurrentArray = CGEN_GetRange(cal_id_min, cal_id_max, cal_id_stp);

	if (CAL_IdCollect(CurrentArray, cal_Iterations))
	{
		CAL_SaveId("ECDCCurrentBoard_id_fixed");

		// Plot relative error distribution
		scattern(cal_id_sc, cal_id_err, "Current (in mA)", "Error (in %)", "Current relative error");
	}
}

function CAL_VerifyUd()
{	
	// Collect data
	CAL_ResetA();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureUd);

	// Reload values
	var VoltageArray = CGEN_GetRange(cal_ud_min, cal_ud_max, cal_ud_stp);

	if (CAL_UdCollect(VoltageArray, cal_Iterations))
	{
		CAL_SaveUd("ECDCCurrentBoard_ud_fixed");

		// Plot relative error distribution
		scattern(cal_ud_sc, cal_ud_err, "Voltage (in mV)", "Error (in %)", "Voltage relative error");
	}
}

function CAL_TekInit(Channel)
{
	// Init channels
	TEK_ChannelInit(Channel, "1", "1");
	TEK_ChannelInit(cal_chSync, "1", "1");
	TEK_ChannelScale(Channel, "1");
	// Init trigger
	TEK_TriggerInit(cal_chSync, "4");
	// Horizontal settings
	TEK_Horizontal("2.5e-3", "0");
	
		// Display channels
	for (var i = 1; i <= 4; i++)
	{
		if (i == Channel || i == channelSync)
			TEK_ChannelOn(i);
		else
			TEK_ChannelOff(i);
	}

	CAL_TekCursor(Channel);
}

function CAL_TekCursor(Channel)
{
	TEK_Send("cursor:select:source ch" + Channel);
	TEK_Send("cursor:function vbars");
	TEK_Send("cursor:vbars:position1 0");
	TEK_Send("cursor:vbars:position2 0");
}

function CAL_Measure(Channel, Resolution)
{
	TEK_Send("cursor:select:source ch" + Channel);
	sleep(500);

	var f = TEK_Exec("cursor:vbars:hpos2?");
	if (Math.abs(f) > 2e+4)
		f = 0;
	return parseFloat(f).toFixed(Resolution);
}

function CAL_IdCollect(CurrentValues, IterationsCount)
{
	cal_cntTotal = IterationsCount * CurrentValues.length;
	cal_cntDone = 1;

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
			print("-- result " + cal_cntDone++ + " of " + cal_cntTotal + " --");
			
			CAL_TekScale(cal_chMeasureId, (CurrentValues[j] * cal_LoadResistance / 1000));
			TEK_TriggerInit(cal_chSync, 4);
			sleep(1000);

			//
			var cal_print_copy = ECDC_CB_Print;
			ECDC_CB_Print = 0;

			for (var k = 0; k < AvgNum; k++)
			{
				ECDC_CB_Measure(CurrentValues[j], cal_ud_test);
			}
			
			ECDC_CB_Print = cal_print_copy;
			
			// Unit data
			var id_read = r32(250);
			cal_id.push(id_read);
			print("Idread, mA: " + id_read);

			// Scope data
			var id_sc = (CAL_Measure(cal_chMeasureId, "4") / cal_CurrentShunt_Ohm[cal_CurrentRange] * 1000).toFixed(0);
			cal_id_sc.push(id_sc);
			print("Idtek, mA: " + id_sc);

			// Relative error
			cal_id_err.push(((id_read - id_sc) / id_sc * 100).toFixed(2));
			print("--------------------");
			
			if (anykey()) return 0;
		}
	}

	return 1;
}

function CAL_UdCollect(VoltageValues, IterationsCount)
{
	cal_cntTotal = IterationsCount * VoltageValues.length;
	cal_cntDone = 1;

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
			print("-- result " + cal_cntDone++ + " of " + cal_cntTotal + " --");
			
			CAL_TekScale(cal_chMeasureUd, VoltageValues[j] / 1000);
			TEK_TriggerInit(cal_chSync, 4);
			sleep(1000);

			//
			var cal_print_copy = ECDC_CB_Print;
			ECDC_CB_Print = 0;

			for (var k = 0; k < AvgNum; k++)
			{
				ECDC_CB_Measure(VoltageValues[j] / cal_LoadResistance, cal_VoltageRangeArray[cal_VoltageRange]);
			}
			
			ECDC_CB_Print = cal_print_copy;
			
			// Unit data
			var ud_read = dev.r(252);
			cal_ud.push(ud_read);
			print("Udread, mV: " + ud_read);

			// Scope data
			var ud_sc = (CAL_Measure(cal_chMeasureUd, "4")).toFixed(0);
			
			if(CAL_TekVerticalUnits() == "VOLTS")
				ud_sc = ud_sc * 1000;
			
			cal_ud_sc.push(ud_sc);
			print("Udtek, mV: " + ud_sc);

			// Relative error
			cal_ud_err.push(((ud_read - ud_sc) / ud_sc * 100).toFixed(2));
			print("--------------------");
			
			if (anykey()) return 0;
		}
	}

	return 1;
}

function CAL_TekScale(Channel, Value)
{
	Value = Value / 7;
	TEK_Send("ch" + Channel + ":scale " + Value);
}

function CAL_TekVerticalUnits()
{
	return(TEK_Send("cursor:hbars:units?"));
}

function CAL_ResetA()
{
	// Results storage
	cal_id = [];
	cal_ud = [];

	// Tektronix data
	cal_id_sc = [];
	cal_ud_sc = [];

	// Relative error
	cal_id_err = [];
	cal_ud_err = [];

	// Correction
	cal_id_corr = [];
	cal_ud_corr = [];
}

function CAL_SaveId(NameId)
{
	CGEN_SaveArrays(NameId, cal_id, cal_id_sc, cal_id_err);
}

function CAL_SaveUd(NameUd)
{
	CGEN_SaveArrays(NameUd, cal_ud_sc, cal_ud, cal_ud_err);
}

function CAL_PrintCoefId()
{
	switch(cal_CurrentRange)
	{
		case 0:
		{
			print("Id range 20mA P0 x1e6  : " + dev.rs(26));
			print("Id range 20mA P1 x1000 : " + dev.rs(27));
			print("Id range 20mA P2 x1000 : " + dev.rs(28));
		}
		break;
		
		case 1:
		{
			print("Id range 200mA P0 x1e6  : " + dev.rs(31));
			print("Id range 200mA P1 x1000 : " + dev.rs(32));
			print("Id range 200mA P2 x1000 : " + dev.rs(33));
		}
		break;
		
		case 2:
		{
			print("Id range 2A P0 x1e6  : " + dev.rs(36));
			print("Id range 2A P1 x1000 : " + dev.rs(37));
			print("Id range 2A P2 x1000 : " + dev.rs(38));
		}
		break;
		
		case 3:
		{
			print("Id range 20A P0 x1e6  : " + dev.rs(41));
			print("Id range 20A P1 x1000 : " + dev.rs(42));
			print("Id range 20A P2 x1000 : " + dev.rs(43));
		}
		break;
		
		case 4:
		{
			print("Id range 270A P0 x1e6  : " + dev.rs(46));
			print("Id range 270A P1 x1000 : " + dev.rs(47));
			print("Id range 270A P2 x1000 : " + dev.rs(48));
		}
		break;
	}
}

function CAL_PintCoefUd()
{
	switch(cal_VoltageRange)
	{
		case 0:
		{
			print("Ud range 30mV P0 x1e6  : " + dev.rs(6));
			print("Ud range 30mV P1 x1000 : " + dev.rs(7));
			print("Ud range 30mV P2 x1000 : " + dev.rs(8));
		}
		break;
		
		case 1:
		{
			print("Ud range 250mV P0 x1e6  : " + dev.rs(11));
			print("Ud range 250mV P1 x1000 : " + dev.rs(12));
			print("Ud range 250mV P2 x1000 : " + dev.rs(13));
		}
		break;
		
		case 2:
		{
			print("Ud range 1.5V P0 x1e6  : " + dev.rs(16));
			print("Ud range 1.5V P1 x1000 : " + dev.rs(17));
			print("Ud range 1.5V P2 x1000 : " + dev.rs(18));
		}
		break;
		
		case 3:
		{
			print("Ud range 11V P0 x1e6  : " + dev.rs(21));
			print("Ud range 11V P1 x1000 : " + dev.rs(22));
			print("Ud range 11V P2 x1000 : " + dev.rs(23));
		}
		break;
	}
}

function CAL_ResetIdCal()
{
	CAL_SetCoefId(0, 1, 0);
}

function CAL_ResetUdCal()
{
	CAL_SetCoefUd(0, 1, 0);
}

function CAL_SetCoefId(P2, P1, P0)
{
	switch(cal_CurrentRange)
	{
		case 0:
		{
			dev.ws(26, Math.round(P0));
			dev.w(27, Math.round(P1 * 1000));
			dev.ws(28, Math.round(P2 * 1e6));
		}
		break;
		
		case 1:
		{
			dev.ws(31, Math.round(P0));
			dev.w(32, Math.round(P1 * 1000));
			dev.ws(33, Math.round(P2 * 1e6));
		}
		break;
		
		case 2:
		{
			dev.ws(36, Math.round(P0));
			dev.w(37, Math.round(P1 * 1000));
			dev.ws(38, Math.round(P2 * 1e6));
		}
		break;
		
		case 3:
		{
			dev.ws(41, Math.round(P0));
			dev.w(42, Math.round(P1 * 1000));
			dev.ws(43, Math.round(P2 * 1e6));
		}
		break;
		
		case 4:
		{
			dev.ws(46, Math.round(P0));
			dev.w(47, Math.round(P1 * 1000));
			dev.ws(48, Math.round(P2 * 1e6));
		}
		break;
	}
}

function CAL_SetCoefUd(P2, P1, P0)
{
switch(cal_VoltageRange)
	{
		case 0:
		{
			dev.ws(6, Math.round(P0));
			dev.w(7, Math.round(P1 * 1000));
			dev.ws(8, Math.round(P2 * 1e6));
		}
		break;
		
		case 1:
		{
			dev.ws(11, Math.round(P0));
			dev.w(12, Math.round(P1 * 1000));
			dev.ws(13, Math.round(P2 * 1e6));
		}
		break;
		
		case 2:
		{
			dev.ws(16, Math.round(P0));
			dev.w(17, Math.round(P1 * 1000));
			dev.ws(18, Math.round(P2 * 1e6));
		}
		break;
		
		case 3:
		{
			dev.ws(21, Math.round(P0));
			dev.w(22, Math.round(P1 * 1000));
			dev.ws(23, Math.round(P2 * 1e6));
		}
		break;
	}	
}
