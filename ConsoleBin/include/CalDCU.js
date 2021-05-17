include("TestDCU.js")
include("Tektronix.js")
include("CalGeneral.js")

// Calibration setup parameters
cal_Rshunt = 1000;	// uOhm
cal_Points = 10;
//
cal_IdMin = 100;	
cal_IdMax = 400;
cal_IdStp = (cal_IdMax - cal_IdMin) / cal_Points;

cal_IntPsVmin = 90;	// V
cal_IntPsVmax = 125;

CurrentRateTest = 0.5; // 0.5, 0.75, 1, 2.5, 5, 7.5, 10, 15, 25, 30, 50 A/us

cal_Iterations = 1;
cal_UseAvg = 1;
//		

// Counters
cal_CntTotal = 0;
cal_CntDone = 0;

// Channels
cal_chMeasureId = 1;
cal_chSync = 3;

// Results storage
cal_Id = [];
cal_Idset = [];
cal_Irate = [];

// Tektronix data
cal_IdSc = [];
cal_IdSc = [];
cal_Irate = [];

// Relative error
cal_IdErr = [];
cal_IdsetErr = [];
cal_Irate = [];

// Correction
cal_IdCorr = [];
cal_IdsetCorr = [];
cal_IrateCorr = [];


function CAL_Init(portDevice, portTek, channelMeasureId)
{
	if (channelMeasureId < 1 || channelMeasureId > 4)
	{
		print("Wrong channel numbers");
		return;
	}

	// Copy channel information
	cal_chMeasureId = channelMeasureId;

	// Init device port
	dev.Disconnect();
	dev.Connect(portDevice);

	// Init Tektronix port
	TEK_PortInit(portTek);
	
	// Tektronix init
	for (var i = 1; i <= 4; i++)
	{
		if (i == channelMeasureId)
			TEK_ChannelOn(i);
		else
			TEK_ChannelOff(i);
	}
}
//--------------------

function CAL_CalibrateId()
{		
	CAL_ResetA();
	CAL_ResetIdCal();
	CAL_ResetIdsetCal();
	
	// Tektronix init
	CAL_TekInitId();

	// Reload values
	var CurrentArray = CGEN_GetRange(cal_IdMin, cal_IdMax, cal_IdStp);

	if (CAL_CollectId(CurrentArray, cal_Iterations))
	{
		CAL_SaveId("DCU_Id");
		CAL_SaveIdset("DCU_Idset");

		// Plot relative error distribution
		scattern(cal_IdSc, cal_IdErr, "Current (in A)", "Error (in %)", "Current relative error");
		scattern(cal_IdSc, cal_IdsetErr, "Current (in A)", "Error (in %)", "Current set relative error");

		// Calculate correction
		cal_IdCorr = CGEN_GetCorrection2("DCU_Id");
		CAL_SetCoefId(cal_IdCorr[0], cal_IdCorr[1], cal_IdCorr[2]);
		CAL_PrintCoefId();
		
		cal_IdsetCorr = CGEN_GetCorrection2("DCU_Idset");
		CAL_SetCoefIdset(cal_IdsetCorr[0], cal_IdsetCorr[1], cal_IdsetCorr[2]);
		CAL_PrintCoefIdset();
	}
}
//--------------------

function CAL_CalibrateIrate()
{		
	CAL_ResetA();
	CAL_ResetIrateCal();
	
	// Tektronix init
	CAL_TekInitIrate();

	CAL_CompensationIrate();	
}
//--------------------

function CAL_VerifyId()
{		
	CAL_ResetA();
	
	// Tektronix init
	CAL_TekInitId();

	// Reload values
	var CurrentArray = CGEN_GetRange(cal_IdMin, cal_IdMax, cal_IdStp);

	if (CAL_CollectId(CurrentArray, cal_Iterations))
	{
		CAL_SaveId("DCU_Id_fixed");
		CAL_SaveId("DCU_Idset_fixed");

		// Plot relative error distribution
		scattern(cal_IdSc, cal_IdErr, "Current (in A)", "Error (in %)", "Current relative error");
		scattern(cal_IdSc, cal_IdsetErr, "Current (in A)", "Error (in %)", "Current set relative error");
	}
}
//--------------------

function CAL_VerifyIrate()
{		
	CAL_ResetA();
	
	// Tektronix init
	CAL_TekInitIrate();

	// Reload values
	var CurrentArray = CGEN_GetRange(cal_IdMin, cal_IdMax, cal_IdStp);

	if (CAL_CollectIrate(CurrentArray, cal_Iterations))
	{
		CAL_SaveIrate("DCU_Irate_fixed");

		// Plot relative error distribution
		scattern(cal_IdSc, cal_IrateErr, "Current (in A)", "Error (in %)", "Current rate relative error");
	}
}
//--------------------

function CAL_CollectId(CurrentValues, IterationsCount)
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
			DCU_TekScaleId(cal_chMeasureId, CurrentValues[j] * cal_Rshunt / 1000000);
			sleep(1000);
			
			for (var k = 0; k < AvgNum; k++)
				DRCU_Pulse(CurrentValues[j], 1500);
			
			// Unit data
			var Id = dev.r(201) / 10;
			cal_Id.push(Id);
			print("Id, A: " + Id);
			
			var IdSet = dev.r(128);
			cal_Idset.push(IdSet);
			print("Idset, A: " + IdSet);

			// Scope data
			var IdSc = (CAL_MeasureId(cal_chMeasureId) / cal_Rshunt * 1000000).toFixed(2);
			cal_IdSc.push(IdSc);
			print("Idtek, A: " + IdSc);

			// Relative error
			var IdErr = ((Id - IdSc) / IdSc * 100).toFixed(2);
			cal_IdErr.push(IdErr);
			print("Iderr, %: " + IdErr);
			
			var IdsetErr = ((IdSet - IdSc) / IdSc * 100).toFixed(2);
			cal_IdsetErr.push(IdsetErr);
			print("Idseterr, %: " + IdsetErr);
			print("--------------------");
			
			if (anykey()) return 0;
		}
	}

	return 1;
}
//--------------------

function CAL_CollectIrate(CurrentValues, IterationsCount)
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
			
			DCU_TekScaleId(cal_chMeasureId, CurrentValues[j] * cal_Rshunt / 1000000);
			sleep(1000);
			
			for (var k = 0; k < AvgNum; k++)
			{
				DRCU_Pulse(CurrentValues[j], CurrentRateTest * 100);
				sleep(1000);
			}

			// Scope data
			var IdSc = (CAL_MeasureId(cal_chMeasureId) / cal_Rshunt * 1000000).toFixed(2);
			cal_IdSc.push(IdSc);
			print("Idtek, A: " + IdSc);
			
			var IrateSc = CAL_MeasureIrate();
			cal_IrateSc.push(IrateSc);
			print("Irate tek, A/us: " + IrateSc);

			// Relative error
			var IrateErr = ((IrateSc - CurrentRateTest) / CurrentRateTest * 100).toFixed(2);
			cal_IrateErr.push(IrateErr);
			print("Irate err, %: " + IrateErr);
			print("--------------------");
			
			if (anykey()) return 0;
		}
	}

	return 1;
}
//--------------------

function CAL_CompensationIrate()
{
	var AvgNum, VoltageMin, VoltageMax, Voltage, Current;
	var ResultVoltageMax, ResultVoltageMin;
	
	if (cal_UseAvg)
		AvgNum = 4;
	else
		AvgNum = 1;
	
	p("Current rate calibration was started");
	
	for (var j = 0; j < 2; j++)
	{	
		VoltageMin = cal_IntPsVmin;
		VoltageMax = cal_IntPsVmax;
		
		if(j == 0)
		{
			p("Step 1 is running...");
			Current = cal_IdMin;
		}
		else
		{
			p("Step 2 is running...");
			Current = cal_IdMax;
		}
	
		DCU_TekScaleId(cal_chMeasureId, Current * cal_Rshunt / 1000000);
		
		for (var i = 0; i < cal_Points; i++)
		{
			TEK_AcquireSample();
			TEK_AcquireAvg(AvgNum);
		
			Voltage = VoltageMin + (VoltageMax - VoltageMin) / 2;
			
			DRCU_InPsVoltageSet(CurrentRateTest, Voltage);
			
			for (var k = 0; k < AvgNum; k++)
			{
				DRCU_Pulse(Current, CurrentRateTest * 100);
				sleep(1000);
			}
			
			var IrateSc = CAL_MeasureIrate();
			
			if(IrateSc < CurrentRateTest)
				VoltageMin = Voltage;
			else
			{
				if(IrateSc > CurrentRateTest)
					VoltageMax = Voltage;
				else
					break;
			}
			
			if((VoltageMin).toFixed(1) == (VoltageMax).toFixed(1))
				break;
			
			if (anykey()) return 0;
		}

		if(j == 0)
			ResultVoltageMax = Voltage;
		else
			ResultVoltageMin = Voltage;
	}
	
	var dI = cal_IdMax - cal_IdMin;
	var dV = ResultVoltageMax - ResultVoltageMin;
	var K = dV / dI * 10000;
	
	if(K < 0)
		K = 0;
	
	p("");
	p("Voltage (Imin = " + cal_IdMin + ") = " + ResultVoltageMax + "V");
	p("Voltage (Imax = " + cal_IdMax + ") = " + ResultVoltageMin + "V");
	p("K = " + K);
	
	CAL_SetCoefIrate(CurrentRateTest, ResultVoltageMax, K);
}
//--------------------

function DCU_TekScaleId(Channel, Value)
{
	Value = Value / 7;
	TEK_Send("ch" + Channel + ":scale " + Value);
	
	TEK_TriggerInit(cal_chMeasureId, Value * 3);
	TEK_Send("trigger:main:edge:slope fall");
}
//--------------------

function CAL_TekInitId()
{
	TEK_ChannelInit(cal_chMeasureId, "1", "0.02");
	TEK_TriggerInit(cal_chMeasureId, "0.06");
	TEK_Send("trigger:main:edge:slope fall");
	TEK_Horizontal("0.1e-3", "-0.4e-3");
	TEK_Send("measurement:meas" + cal_chMeasureId + ":source ch" + cal_chMeasureId);
	TEK_Send("measurement:meas" + cal_chMeasureId + ":type maximum");
}
//--------------------

function CAL_TekInitIrate()
{
	TEK_ChannelInit(cal_chMeasureId, "1", "0.02");
	TEK_TriggerInit(cal_chMeasureId, "0.06");
	TEK_Send("trigger:main:edge:slope fall");
	TEK_Send("measurement:meas" + cal_chMeasureId + ":source ch" + cal_chMeasureId);
	TEK_Send("measurement:meas" + cal_chMeasureId + ":type maximum");
	TEK_Send("measurement:meas1:source ch" + cal_chMeasureId);
	TEK_Send("measurement:meas1:type maximum");
	TEK_Send("measurement:meas2:source ch" + cal_chMeasureId);
	TEK_Send("measurement:meas2:type fall");
	
	switch(CurrentRateTest * 100)
	{
		case 50:
			TEK_Horizontal("100e-6", "0");
			break;
		case 75:
			TEK_Horizontal("100e-6", "0");
			break;
		case 100:
			TEK_Horizontal("50e-6", "0");
			break;
		case 250:
			TEK_Horizontal("25e-6", "0");
			break;
		case 500:
			TEK_Horizontal("10e-6", "0");
			break;
		case 750:
			TEK_Horizontal("10e-6", "0");
			break;
		case 1000:
			TEK_Horizontal("5e-6", "0");
			break;
		case 1500:
			TEK_Horizontal("5e-6", "0");
			break;
		case 2500:
			TEK_Horizontal("2.5e-6", "0");
			break;
		case 3000:
			TEK_Horizontal("2.5e-6", "0");
			break;
		case 5000:
			TEK_Horizontal("1e-6", "0");
			break;
	}
}
//--------------------

function CAL_TekScale(Channel, Value)
{
	Value = Value / 6;
	TEK_Send("ch" + Channel + ":scale " + Value);
}
//--------------------

function CAL_MeasureId(Channel)
{
	return TEK_Measure(Channel);
}
//--------------------

function CAL_MeasureIrate()
{
	return ((TEK_Measure(1) * 0.8 / cal_Rshunt * 1e6 / TEK_Exec("measurement:meas2:value?") * 1e-6).toFixed(3));
}
//--------------------

function CAL_ResetA()
{	
	// Results storage
	cal_Id = [];
	cal_Idset = [];
	cal_Irateset = [];

	// Tektronix data
	cal_IdSc = [];
	cal_IdSc = [];
	cal_IrateSc = [];

	// Relative error
	cal_IdErr = [];
	cal_IdsetErr = [];
	cal_IrateErr = [];

	// Correction
	cal_IdCorr = [];
	cal_IdsetCorr = [];
	cal_IrateCorr = [];
}
//--------------------

function CAL_SaveId(NameId)
{
	CGEN_SaveArrays(NameId, cal_Id, cal_IdSc, cal_IdErr);
}
//--------------------

function CAL_SaveIdset(NameIdset)
{
	CGEN_SaveArrays(NameIdset, cal_IdSc, cal_Idset, cal_IdsetErr);
}
//--------------------

function CAL_SaveIrate(NameIrate)
{
	CGEN_SaveArrays(NameIrate, cal_IrateSc, CurrentRateTest, cal_IrateErr);
}
//--------------------

function CAL_ResetIdCal()
{
	CAL_SetCoefId(0, 1, 0);
}
//--------------------

function CAL_ResetIdsetCal()
{
	CAL_SetCoefIdset(0, 1, 0);
}
//--------------------

function CAL_ResetIrateCal()
{
	CAL_SetCoefIrate(CurrentRateTest, 110, 0);
}
//--------------------

function CAL_SetCoefIrate(CurrentRate, Voltage, K)
{
	switch(CurrentRateTest * 100)
	{
		case 50:
			dev.w(87, K);
			dev.w(52, Voltage * 10);
			break;
		case 75:
			dev.w(88, K);
			dev.w(53, Voltage * 10);
			break;
		case 100:
			dev.w(89, K);
			dev.w(54, Voltage * 10);
			break;
		case 250:
			dev.w(90, K);
			dev.w(55, Voltage * 10);
			break;
		case 500:
			dev.w(91, K);
			dev.w(56, Voltage * 10);
			break;
		case 750:
			dev.w(92, K);
			dev.w(57, Voltage * 10);
			break;
		case 1000:
			dev.w(93, K);
			dev.w(58, Voltage * 10);
			break;
		case 1500:
			dev.w(94, K);
			dev.w(59, Voltage * 10);
			break;
		case 2500:
			dev.w(95, K);
			dev.w(60, Voltage * 10);
			break;
		case 3000:
			dev.w(96, K);
			dev.w(61, Voltage * 10);
			break;
		case 5000:
			dev.w(97, K);
			dev.w(62, Voltage * 10);
			break;
	}
}
//--------------------

function CAL_SetCoefId(P2, P1, P0)
{
	dev.ws(14, Math.round(P2 * 1e6));
	dev.w(13, Math.round(P1 * 1000));
	dev.ws(12, Math.round(P0));	
}
//--------------------

function CAL_SetCoefIdset(P2, P1, P0)
{
	dev.ws(19, Math.round(P2 * 1e6));
	dev.w(18, Math.round(P1 * 1000));
	dev.ws(17, Math.round(P0));	
}
//--------------------

function CAL_PrintCoefId()
{
	print("Id P2 x1e6		: " + dev.rs(14));
	print("Id P1 x1000		: " + dev.rs(13));
	print("Id P0 			: " + dev.rs(12));
}
//--------------------

function CAL_PrintCoefIdset()
{
	print("Idset P2 x1e6	: " + dev.rs(19));
	print("Idset P1 x1000	: " + dev.rs(18));
	print("Idset P0 		: " + dev.rs(17));
}
//--------------------