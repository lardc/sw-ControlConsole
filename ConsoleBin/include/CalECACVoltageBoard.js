include("TestECAC.js")
include("Tektronix.js")
include("CalGeneral.js")

// Global definitions
DEV_STATE_INPROCESS = 4
DEV_STATE_INREADY = 3

// Input params
cal_VoltageRangeArrayMin = [5000, 40000];				// Min mV values for ranges
cal_VoltageRangeArrayMax = [45000, 330000];				// Max mV values for ranges

cal_CurrentRangeArrayMin = [10, 250, 4000];				// Min uA values for ranges
cal_CurrentRangeArrayMax = [300, 5000, 110000];			// Max uA values for ranges

cal_VoltageRange  = 0;		
cal_CurrentRange  = 0;	
cal_OutLine = 0;	// 0 - nothing line, 1 - POW, 2 - ctrl	
cal_Rload = 1;	
cal_Rshunt = 1;

AvgNum_L = 16;
AvgNum_H = 128;
AvgNum = AvgNum_L;
	
// Counters
cal_cntTotal = 0;
cal_cntDone = 0;

// Iterations
cal_Iterations = 3;

// Channels
cal_chMeasureId = 0;
cal_chMeasureUd = 0;

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

cal_WaitTimeVoltageReady = 15 // Seconds
cal_WaitTimeVoltageCollect = 10 // Seconds
//------------------------

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
	
	// Init ECACVoltageBoard
	dev.Disconnect();
	dev.Connect(portDevice);
	
	// Init Tektronix
	TEK_PortInit(portTek);
	
	// Init channels
	TEK_ChannelOn(cal_chMeasureUd);
	TEK_ChannelOn(cal_chMeasureId);
	
	TEK_ChannelInit(cal_chMeasureUd, "1", "1");
	TEK_ChannelInit(cal_chMeasureId, "1", "1");
}
//------------------------

function CAL_CalibrateUd()
{
	var ud_min	= cal_VoltageRangeArrayMin[cal_VoltageRange];
	var ud_max	= cal_VoltageRangeArrayMax[cal_VoltageRange];
	var ud_stp	= (ud_max - ud_min) / 10;
	
	TEK_ChannelInit(cal_chMeasureUd, "100", "1");
	TEK_Send("ch" + cal_chMeasureUd + ":position 0");
	TEK_ChannelOff(cal_chMeasureId);
	
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
//------------------------

function CAL_CalibrateId()
{
	var ud_max = Math.round((cal_CurrentRangeArrayMax[cal_CurrentRange] * cal_Rload) / 1000);
	var ud_min = Math.round((cal_CurrentRangeArrayMin[cal_CurrentRange] * cal_Rload) / 1000);
	var ud_stp = Math.round((ud_max - ud_min) / 10);
	
	TEK_ChannelOn(cal_chMeasureId);
	TEK_ChannelOn(cal_chMeasureUd);
	
	TEK_ChannelInit(cal_chMeasureUd, "100", "1");
	TEK_Send("ch" + cal_chMeasureUd + ":position 1");
	
	TEK_ChannelInit(cal_chMeasureId, "1", "1");
	TEK_Send("ch" + cal_chMeasureId + ":position -1");
	
	CAL_ResetA();
	CAL_ResetIdCal();
	
	var VoltageArray = CGEN_GetRange(ud_min, ud_max, ud_stp);
	
	if (CAL_Collect(VoltageArray, cal_Iterations, cal_PrintModeI))
	{
		CAL_SaveId("ECACVoltageBoard_id");

		// Plot relative error distribution
		scattern(cal_id_sc, cal_id_err, "Current (in uI)", "Error (in %)", "Current relative error");

		// Calculate correction
		cal_id_corr = CGEN_GetCorrection2("ECACVoltageBoard_id");
		CAL_SetCoefId(cal_id_corr[0], cal_id_corr[1], cal_id_corr[2]);
		CAL_PrintCoefId();
	}		
}
//------------------------

function CAL_VerifyUd()
{	
	var ud_min	= cal_VoltageRangeArrayMin[cal_VoltageRange];
	var ud_max	= cal_VoltageRangeArrayMax[cal_VoltageRange];
	var ud_stp	= (ud_max - ud_min) / 10;
	
	TEK_ChannelInit(cal_chMeasureUd, "100", "1");
	TEK_Send("ch" + cal_chMeasureUd + ":position 1");
	TEK_ChannelOff(cal_chMeasureId);
	
	// Collect data
	CAL_ResetA();

	// Reload values
	var VoltageArray = CGEN_GetRange(ud_min, ud_max, ud_stp);

	if (CAL_Collect(VoltageArray, cal_Iterations, cal_PrintModeU))
	{
		CAL_SaveUd("ECACVoltageBoard_ud_fixed");

		// Plot relative error distribution
		scattern(cal_ud_sc, cal_ud_err, "Voltage (in V)", "Error (in %)", "Voltage relative error");
	}
}
//------------------------

function CAL_VerifyId()
{
	var ud_max = Math.round((cal_CurrentRangeArrayMax[cal_CurrentRange] * cal_Rload) / 1000);
	var ud_min = Math.round((cal_CurrentRangeArrayMin[cal_CurrentRange] * cal_Rload) / 1000);
	var ud_stp = Math.round((ud_max - ud_min) / 10);
	
	TEK_ChannelOn(cal_chMeasureId);
	TEK_ChannelOn(cal_chMeasureUd);
	
	TEK_ChannelInit(cal_chMeasureUd, "100", "1");
	TEK_Send("ch" + cal_chMeasureUd + ":position 1");
	
	TEK_ChannelInit(cal_chMeasureId, "1", "1");
	TEK_Send("ch" + cal_chMeasureId + ":position -1");
		
	// Collect data
	CAL_ResetA();

	// Reload values
	var VoltageArray = CGEN_GetRange(ud_min, ud_max, ud_stp);

	if (CAL_Collect(VoltageArray, cal_Iterations, cal_PrintModeI))
	{
		CAL_SaveId("ECACVoltageBoard_id_fixed");

		// Plot relative error distribution
		scattern(cal_id_sc, cal_id_err, "Current (in uA)", "Error (in %)", "Current relative error");
	}
}
//------------------------

function CAL_Collect(VoltageValues, IterationsCount, PrintMode)
{
	cal_cntTotal = IterationsCount * VoltageValues.length;
	cal_cntDone = 1;
		
	// Init measurement
	CAL_TekMeasurement(cal_chMeasureUd);
	CAL_TekMeasurement(cal_chMeasureId);
	
	// Horizontal settings
	TEK_Horizontal("1e-2", 0);
	
	// Init trigger
	TEK_TriggerInit(cal_chMeasureUd, "5");

	sleep(500);
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < VoltageValues.length; j++)
		{
			print("-- result " + cal_cntDone++ + " of " + cal_cntTotal + " --");
			
			p("Voltage set = " + VoltageValues[j] + " mV");
			
			CAL_TekScale(cal_chMeasureUd, VoltageValues[j]);
			CAL_TekScale(cal_chMeasureId, VoltageValues[j] / cal_Rload * cal_Rshunt);
//			TEK_TriggerLevelF(VoltageValues[j] / 2);
			sleep(1000);
			
			TEK_AcquireSample();
			
			sleep(500);
			
			ECAC_Pulse(VoltageValues[j], cal_CurrentRangeArrayMax[cal_CurrentRange], cal_OutLine);
			
			sleep(100);
			if(CAL_IsDevState() == DEV_STATE_INPROCESS)
			{
				CAL_WaitReadyVoltage();
				
				if(cal_CurrentRange>0)
				{
					AvgNum = AvgNum_L;
				}
				else
				{
					AvgNum = AvgNum_H;
				}
				
				TEK_AcquireAvg(AvgNum);
				
				sleep(500);
				
				CAL_WaitCollect();
				ECAC_Stop();
				sleep(200);
				CAL_Probe(PrintMode);
			}
			else
			{
				p("Device not in process! Operation abort.");
				return 0;
			}
			
			if(anykey()) return 0;
		}
	}
	return 1;
}
//------------------------

function CAL_Probe(PrintMode)
{
	// Unit data
	var ud_read = r32(200).toFixed(2);
	cal_ud.push(ud_read);
	
	var id_read = r32(202).toFixed(2);
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
			print("Udread, mV: " + ud_read);
			print("Udtek, mV: " + ud_sc);
			print("Uderr, %: " + ud_err);
			print("---------------------");
			break;
		
		case 2:
			print("Idread, uA: " + id_read);
			print("Idtek, uA: " + id_sc);
			print("Iderr, %: " + id_err);
			print("---------------------");
			break;
	}
}
//------------------------

function CAL_TekMeasurement(Channel)
{
	TEK_Send("measurement:meas" + Channel + ":source ch" + Channel);
	TEK_Send("measurement:meas" + Channel + ":type crms");
}
//------------------------

function CAL_MeasureUd(Channel)
{
	var f = TEK_Measure(Channel);
	if (Math.abs(f) > 2e+4)
		f = 0;
	return Math.round(f * 1000);
}
//------------------------

function CAL_MeasureId(Channel)
{
	var f = TEK_Measure(Channel);
	if (Math.abs(f) > 2e+4)
		f = 0;
	return f / cal_Rshunt * 1000000;
}
//------------------------

function CAL_TekScale(Channel, Value)
{
	Value = Value / 1000;
	TEK_Send("ch" + Channel + ":scale " + Value);
}
//------------------------

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
//------------------------

function CAL_SaveId(NameId)
{
	CGEN_SaveArrays(NameId, cal_id, cal_id_sc, cal_id_err);
}
//------------------------

function CAL_SaveUd(NameUd)
{
	CGEN_SaveArrays(NameUd, cal_ud, cal_ud_sc, cal_ud_err);
}
//------------------------

function CAL_PrintCoefUd()
{
	switch(cal_VoltageRange)
	{
		case 0:
		{
			print("Ud range U1 P0 : " + dev.rs(17));
			print("Ud range U1 P1 x1000 : " + dev.rs(16));
			print("Ud range U1 P2 x1e6 : " + dev.rs(15));
		}
		break;
		
		case 1:
		{
			print("Ud range U2 P0: " + dev.rs(22));
			print("Ud range U2 P1 x1000: " + dev.rs(21));
			print("Ud range U2 P2 x1e6: " + dev.rs(20));
		}
		break;
	}
}
//------------------------

function CAL_PrintCoefId()
{
	switch(cal_CurrentRange)
	{
		case 0:
		{
			print("Id range I1 P0 : " + dev.rs(27));
			print("Id range I1 P1 x1000 : " + dev.rs(26));
			print("Id range I1 P2 x1e6 : " + dev.rs(25));
		}
		break;
		
		case 1:
		{
			print("Id range I2 P0 : " + dev.rs(32));
			print("Id range I2 P1 x1000 : " + dev.rs(31));
			print("Id range I2 P2 x1e6 : " + dev.rs(30));
		}
		break;
		
		case 2:
		{
			print("Id range I3 P0 : " + dev.rs(37));
			print("Id range I3 P1 x1000 : " + dev.rs(36));
			print("Id range I3 P2 x1e6 : " + dev.rs(35));
		}
		break;
	}
}
//------------------------

function CAL_ResetUdCal()
{
	CAL_SetCoefUd(0, 1, 0);
}
//------------------------

function CAL_ResetIdCal()
{
	CAL_SetCoefId(0, 1, 0);
}
//------------------------

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
//------------------------

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
//------------------------

function CAL_WaitReadyVoltage()
{
	var k;
	for(k = 0; k < cal_WaitTimeVoltageReady; k ++) 
	{
		sleep(1000);
		if(CAL_IsRedyVoltage())
		{
			break;
		}
	}
	
	if(k >= (cal_WaitTimeVoltageReady - 1))
	{
		p("Voltage ready is time out!");
	}
}
//------------------------

function CAL_IsRedyVoltage()
{
	var RegisterVoltageReady = 204;
	return dev.r(RegisterVoltageReady);
}
//------------------------

function CAL_IsDevState()
{
	var RegisterState = 192;
	return dev.r(RegisterState);
}
//------------------------

function CAL_WaitCollect()
{
	for(var k = 0; k < cal_WaitTimeVoltageCollect; k++) 
	{
		sleep(1000);
	}
}