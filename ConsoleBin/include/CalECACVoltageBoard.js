include("TestECAC.js")
include("Tektronix.js")
include("CalGeneral.js")

// Global definitions

// Input params
cal_VoltageRangeArrayMin = [5, 40];						// Min voltage values for ranges
cal_VoltageRangeArrayMax = [45, 330];					// Max voltage values for ranges

cal_CurrentRangeArrayMin = [10, 250, 4000];				// Min current values for ranges
cal_CurrentRangeArrayMax = [300, 5000, 110000];			// Max current values for ranges

cal_VoltageRange   = 0;		
cal_CurrentRange   = 0;	
cal_OutLine = 0;	
cal_Rload = 1;	
cal_Rshunt = 1;

cal_VoltageRiseRate = 1;
cal_VoltageReadyThr = 1;
	
// Counters
cal_cntTotal = 0;
cal_cntDone = 0;

// Iterations
cal_Iterations = 3;

// Channels
cal_chMeasureId = 1;
cal_chMeasureUd = 2;

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

cal_PrintModeU = 1;
cal_PrintModeI = 2;

function CAL_Init(portDevice, portTek, channelMeasureId, channelMeasureUd)
{
	if (channelMeasureId < 1 || channelMeasureId > 4 ||
		channelMeasureUd < 1 || channelMeasureUd > 4)
	{
		print("Wrong channel numbers");
		return;
	}
	
	// Copy channel information
	cal_chMeasureUd = channelMeasureUd;
	cal_chMeasureId = channelMeasureId;
	
	// Init BVT
	dev.Disconnect();
	dev.Connect(portDevice);
	
	// Init Tektronix
	TEK_PortInit(portTek);
	
	// Init channels
	TEK_ChannelInit(cbvt_chMeasureV, "1", "1");
	TEK_ChannelInit(cbvt_chMeasureI, "1", "1");
}

function CAL_CalibrateUd()
{
	ud_min	= cal_VoltageRangeArrayMin[cal_VoltageRange];
	ud_max	= cal_VoltageRangeArrayMax[cal_VoltageRange];
	ud_stp	= (ud_max - ud_min) / 10;
	
	if(cal_VoltageRange != 0)
	{
		TEK_ChannelInit(cal_chMeasureUd, "10", "10");
	}
	
	CAL_ResetA();
	CAL_ResetUdCal();
	
	var VoltageArray = CGEN_GetRange(ud_min, ud_max, ud_stp);
	
	if (CAL_Collect(VoltageArray, cal_Iterations, cal_PrintModeU))
	{
		CAL_SaveUd("ECACVoltageBoard_ud");

		// Plot relative error distribution
		scattern(cal_ud_sc, cal_ud_err, "Voltage (in V)", "Error (in %)", "Voltage relative error");

		// Calculate correction
		cal_ud_corr = CGEN_GetCorrection2("ECACVoltageBoard_ud");
		CAL_SetCoefUd(cal_ud_corr[0], cal_ud_corr[1], cal_ud_corr[2]);
		CAL_PrintCoefUd();
	}	
}

function CAL_CalibrateId()
{
	ud_max = Math.round(cal_CurrentRangeArrayMax[cal_CurrentRange] * cal_Rload * 0.9 / 1000000);
	ud_min = Math.round(cal_CurrentRangeArrayMin[cal_CurrentRange] * cal_Rload * 0.9 / 1000000);
	ud_stp = Math.round((ud_max - ud_min) / 10) ;
	
	if(cal_VoltageRange != 0)
	{
		TEK_ChannelInit(cal_chMeasureUd, "10", "10");
	}
	
	CAL_ResetA();
	CAL_ResetIdCal();
	
	var VoltageArray = CGEN_GetRange(ud_min, ud_max, ud_stp);
	
	if (CAL_Collect(VoltageArray, cal_Iterations, cal_PrintModeI))
	{
		CAL_SaveUd("ECACVoltageBoard_id");

		// Plot relative error distribution
		scattern(cal_id_sc, cal_id_err, "Current (in uI)", "Error (in %)", "Current relative error");

		// Calculate correction
		cal_id_corr = CGEN_GetCorrection2("ECACVoltageBoard_id");
		CAL_SetCoefUd(cal_id_corr[0], cal_id_corr[1], cal_id_corr[2]);
		CAL_PrintCoefId();
	}		
}

function CAL_VerifyUd()
{	

	ud_min	= cal_VoltageRangeArrayMin[cal_VoltageRange];
	ud_max	= cal_VoltageRangeArrayMax[cal_VoltageRange];
	ud_stp	= (ud_max - ud_min) / 10;
	
	if(cal_VoltageRange != 0)
	{
		TEK_ChannelInit(cal_chMeasureUd, "10", "10");
	}
	
	// Collect data
	CAL_ResetA();

	// Reload values
	var VoltageArray = CGEN_GetRange(cal_ud_min, cal_ud_max, cal_ud_stp);

	if (CAL_Collect(VoltageArray, cal_Iterations, cal_PrintModeU))
	{
		CAL_SaveUd("ECACVoltageBoard_ud_fixed");

		// Plot relative error distribution
		scattern(cal_ud_sc, cal_ud_err, "Voltage (in V)", "Error (in %)", "Voltage relative error");
	}
}

function CAL_VerifyId()
{
	ud_max = Math.round(cal_CurrentRangeArrayMax[cal_CurrentRange] * cal_Rload * 0.95 / 1000000);
	ud_min = Math.round(cal_CurrentRangeArrayMin[cal_CurrentRange] * cal_Rload * 0.95 / 1000000);
	ud_stp = Math.round((ud_max - ud_min) / 10) ;
	
	if(cal_VoltageRange != 0)
	{
		TEK_ChannelInit(cal_chMeasureUd, "10", "10");
	}
	
	// Collect data
	CAL_ResetA();
	
	// Tektronix init
	CAL_TekInit(cal_chMeasureId);

	// Reload values
	var VoltageArray = CGEN_GetRange(ud_min, ud_max, ud_stp);

	if (CAL_Collect(VoltageArray, cal_Iterations, cal_PrintModeI))
	{
		CAL_SaveId("ECACVoltageBoard_id_fixed");

		// Plot relative error distribution
		scattern(cal_id_sc, cal_id_err, "Current (in uA)", "Error (in %)", "Current relative error");
	}
}

function CAL_Collect(VoltageValues, IterationsCount, PrintMode)
{
	cal_cntTotal = IterationsCount * VoltageValues.length;
	cal_cntDone = 1;
	
	// Acquire mode
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
	// Init measurement
	CAL_TekMeasurement(cal_chMeasureUd);
	CAL_TekMeasurement(cal_chMeasureId);
	// Horizontal settings
	TEK_Horizontal("1e-3", "-2e-3");
	// Init trigger
	TEK_TriggerPulseInit(cal_chMeasureUd, "2");
	sleep(500);
	
	// Global configuration
	dev.w(62, cal_VoltageRiseRate); 			//записываем скорость нарастания выходного напряжения 
	dev.w(63, cal_VoltageReadyThr); 			//записываем относительная погрешность срабатывания флага готовности напряжения
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < VoltageValues.length; j++)
		{
			print("-- result " + cal_cntDone++ + " of " + cal_cntTotal + " --");
			
			CAL_TekScale(cal_chMeasureUd, VoltageValues[j]);
			CAL_TekScale(cal_chMeasureId, VoltageValues[j] / cal_Rload * cal_Rshunt);
			TEK_TriggerLevelF(VoltageValues[j] / 2);
			sleep(1000);

			for (var k = 0; k < AvgNum; k++)
			{
				ECAC_Pulse(VoltageValues[j], cal_CurrentRangeArrayMax[cal_CurrentRange], cal_OutLine);
				sleep(1000);
			}
			
			CBVT_Probe(PrintMode);
			
			if (anykey()) return 0;
		}
	}

	return 1;	
	
}

function CAL_Probe(PrintMode)
{
	// Unit data
	var ud_read = dev.r(200);
	cal_ud.push(ud_read);
	
	var id_read = r32(201);
	cal_id.push(id_read);	
	
	// Scope data
	var ud_sc = (CAL_MeasureUd(cal_chMeasureUd)).toFixed(2);			
	cal_ud_sc.push(ud_sc);
			
	var id_sc = (CAL_MeasureId(cal_chMeasureId)).toFixed(2);			
	cal_id_sc.push(id_sc);	
	
	// Relative error
	var ud_err = ((ud_read - ud_sc) / ud_sc * 100).toFixed(2);
	cal_ud_err.push(ud_err);
	
	var id_err = ((id_read - id_sc) / id_sc * 100).toFixed(2);
	cal_id_err.push(id_err);
	
	switch (PrintMode)
	{
		case 1:
			print("Udread, V: " + ud_read);
			print("Udtek, V: " + ud_sc);
			print("Uderr, %: " + ud_err);
			print("--------------------");
			break;
		
		case 2:
			print("Idread, uA: " + id_read);
			print("Idtek, uA: " + id_sc);
			print("Iderr, %: " + ud_err);
			print("--------------------");
			break;
	}
	
}

function CAL_TekMeasurement(Channel)
{
	TEK_Send("measurement:meas" + Channel + ":source ch" + Channel);
	TEK_Send("measurement:meas" + Channel + ":type rms");
}	

function CAL_MeasureUd(Channel)
{
	var f = TEK_Measure(Channel);
	if (Math.abs(f) > 2e+4)
		f = 0;
	return Math.round(f);
}

function CAL_MeasureId(Channel)
{
	var f = TEK_Measure(Channel);
	if (Math.abs(f) > 2e+4)
		f = 0;
	return f / cal_Rshunt * 1000000;
}

function CAL_TekScale(Channel, Value)
{
	Value = Value / 6;
	TEK_Send("ch" + Channel + ":scale " + Value);
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

unction CAL_SaveId(NameId)
{
	CGEN_SaveArrays(NameId, cal_id, cal_id_sc, cal_id_err);
}

function CAL_SaveUd(NameUd)
{
	CGEN_SaveArrays(NameUd, cal_ud, cal_ud_sc, cal_ud_err);
}

function CAL_PrintCoefUd()
{
	switch(cal_VoltageRange)
	{
		case 0:
		{
			print("Ud range U1 P0 x1000  : " + dev.rs(17));
			print("Ud range U1 P1 x1000 : " + dev.rs(16));
			print("Ud range U1 P2 x1e6 : " + dev.rs(15));
		}
		break;
		
		case 1:
		{
			print("Ud range 30mV P0 x1000  : " + dev.rs(22));
			print("Ud range 30mV P1 x1000 : " + dev.rs(21));
			print("Ud range 30mV P2 x1e6 : " + dev.rs(20));
		}
		break;
	}
}

function CAL_PrintCoefId()
{
	switch(cal_CurrentRange)
	{
		case 0:
		{
			print("Id range I1 P0 x1000  : " + dev.rs(27));
			print("Id range I1 P1 x1000 : " + dev.rs(26));
			print("Id range I1 P2 x1e6 : " + dev.rs(25));
		}
		break;
		
		case 1:
		{
			print("Id range I2 P0 x1000  : " + dev.rs(32));
			print("Id range I2 P1 x1000 : " + dev.rs(31));
			print("Id range I2 P2 x1e6 : " + dev.rs(30));
		}
		break;
		
		case 2:
		{
			print("Id range I3 P0 x1000  : " + dev.rs(37));
			print("Id range I3 P1 x1000 : " + dev.rs(36));
			print("Id range I3 P2 x1e6 : " + dev.rs(35));
		}
		break;
	}
}

function CAL_ResetUdCal()
{
	CAL_SetCoefUd(0, 1, 0);
}

function CAL_ResetIdCal()
{
	CAL_SetCoefId(0, 1, 0);
}

function CAL_SetCoefUd(P2, P1, P0)
{
	switch(cal_VoltageRange)
	{
		case 0:
		{
			dev.ws(17, Math.round(P0));
			dev.w(16, Math.round(P1 * 1000));
			dev.ws(15, Math.round(P2 * 1e6));
		}
		break;
		
		case 1:
		{
			dev.ws(22, Math.round(P0));
			dev.w(21, Math.round(P1 * 1000));
			dev.ws(20, Math.round(P2 * 1e6));
		}
		break;
	}
}

function CAL_SetCoefId(P2, P1, P0)
{
switch(cal_CurrentRange)
	{
		case 0:
		{
			dev.ws(27, Math.round(P0));
			dev.w(26, Math.round(P1 * 1000));
			dev.ws(25, Math.round(P2 * 1e6));
		}
		break;
		
		case 1:
		{
			dev.ws(32, Math.round(P0));
			dev.w(31, Math.round(P1 * 1000));
			dev.ws(30, Math.round(P2 * 1e6));
		}
		break;
		
		case 2:
		{
			dev.ws(37, Math.round(P0));
			dev.w(36, Math.round(P1 * 1000));
			dev.ws(35, Math.round(P2 * 1e6));
		}
		break;	
	}	
}

