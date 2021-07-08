include("TestDRCU.js")
include("Tektronix.js")
include("CalGeneral.js")

// Calibration setup parameters
cal_Rshunt = 1000;	// uOhm
cal_Points = 10;
//
cal_IdMin = 100;	
cal_IdMax = 400;
cal_IdStp = (cal_IdMax - cal_IdMin) / cal_Points;

cal_IntPsVmin = 80;	// V
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
cal_VintPS = [];

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
	
	// Tektronix init
	CAL_TekInitIrate();
	
	// Reload values
	var CurrentArray = CGEN_GetRange(cal_IdMin, cal_IdMax, cal_IdStp);

	if (CAL_CompensationIrate(CurrentArray))
	{
		CAL_SaveVintPS("DCU_VintPS");

		// Calculate correction
		cal_IrateCorr = CGEN_GetCorrection("DCU_VintPS");
		CAL_SetCoefIrateCompens(cal_IrateCorr[0], cal_IrateCorr[1]);
		CAL_PrintCoefIrateCompens();
	}	
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
		CAL_SaveVintPS("DCU_Irate_fixed");

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
			var Id = dev.r(202) / 10;
			cal_Id.push(Id);
			print("Id, A: " + Id);
			
			var IdSet = dev.r(128);
			cal_Idset.push(IdSet);
			print("Idset, A: " + IdSet);

			// Scope data
			var IdSc = (CAL_MeasureId(cal_chMeasureId) / cal_Rshunt * 1000).toFixed(2);
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
				if(!DRCU_Pulse(CurrentValues[j], CurrentRateTest * 100))
					return 0;
			}

			// Scope data
			var IdSc = (CAL_MeasureId(cal_chMeasureId) / cal_Rshunt * 1000).toFixed(2);
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

function CAL_CompensationIrate(CurrentValues)
{
	var AvgNum, VoltageMin, VoltageMax, Voltage;
	
	if (cal_UseAvg)
		AvgNum = 4;
	else
		AvgNum = 1;
	
	for (var j = 0; j < CurrentValues.length; j++)
	{	
		VoltageMin = cal_IntPsVmin;
		VoltageMax = cal_IntPsVmax;
	
		DCU_TekScaleId(cal_chMeasureId, CurrentValues[j] * cal_Rshunt / 1000000);
		
		for (var i = 0; i < cal_Points; i++)
		{
			TEK_AcquireSample();
			TEK_AcquireAvg(AvgNum);
		
			Voltage = Math.round((VoltageMin + (VoltageMax - VoltageMin) / 2) * 10) / 10;
			
			dev.w(130, Voltage * 10);
			
			p("Current, A : " + CurrentValues[j]);
			p("VintPS max : " + VoltageMax);
			p("VintPS,  V : " + Voltage);
			p("VintPS min : " + VoltageMin);
			p("-------------");
			
			for (var k = 0; k < AvgNum; k++)
			{
				if(!DRCU_Pulse(CurrentValues[j], CurrentRateTest * 100))
					return 0;
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
			
			if((VoltageMin + 0.2) >= VoltageMax)
				break;
			
			if (anykey()) return 0;
		}

		cal_Idset.push(CurrentValues[j]);
		cal_VintPS.push(Voltage * 10);
	}
	
	dev.w(130, 0);
	
	return 1;
}
//--------------------

function DCU_TekScaleId(Channel, Value)
{
	Value = Value / 7;
	TEK_Send("ch" + Channel + ":scale " + Value);
	
	TEK_TriggerInit(cal_chMeasureId, Value * 3.5);
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
	
	CAL_TekSetHorizontalScale();
}
//--------------------

function CAL_TekSetHorizontalScale()
{
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
	return (TEK_Exec("measurement:meas1:value?") * 1000).toFixed(1);
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
	cal_VintPS = [];

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

function CAL_SaveVintPS(NameVintPS)
{	
	var csv_array = [];
	
	for (var i = 0; i < cal_Idset.length; i++)
		csv_array.push(cal_Idset[i] + ";" + cal_VintPS[i]);
	
	save(cgen_correctionDir + "/" + NameVintPS + ".csv", csv_array);
}
//--------------------

function CAL_SetCoefIrateCompens(K, Offset)
{
	K = parseFloat(K);
	Offset = parseFloat(Offset);
	
	switch(CurrentRateTest * 100)
	{
		case 50:
			dev.ws(41, Offset);
			dev.ws(42, K * 1000);
			break;
		case 75:
			dev.ws(43, Offset);
			dev.ws(44, K * 1000);
			break;
		case 100:
			dev.ws(45, Offset);
			dev.ws(46, K * 1000);
			break;
		case 250:
			dev.ws(47, Offset);
			dev.ws(48, K * 1000);
			break;
		case 500:
			dev.ws(49, Offset);
			dev.ws(50, K * 1000);
			break;
		case 750:
			dev.ws(51, Offset);
			dev.ws(52, K * 1000);
			break;
		case 1000:
			dev.ws(53, Offset);
			dev.ws(54, K * 1000);
			break;
		case 1500:
			dev.ws(55, Offset);
			dev.ws(56, K * 1000);
			break;
		case 2500:
			dev.ws(57, Offset);
			dev.ws(58, K * 1000);
			break;
		case 3000:
			dev.ws(59, Offset);
			dev.ws(60, K * 1000);
			break;
		case 5000:
			dev.ws(61, Offset);
			dev.ws(62, K * 1000);
			break;
	}
}
//--------------------

function CAL_PrintCoefIrateCompens()
{
	switch(CurrentRateTest * 100)
	{
		case 50:
			print("Irate compensation Offset	: " + dev.rs(41));
			print("Irate compensation K x1000	: " + dev.rs(42));
			break;
		case 75:
			print("Irate compensation Offset	: " + dev.rs(43));
			print("Irate compensation K x1000	: " + dev.rs(44));
			break;
		case 100:
			print("Irate compensation Offset	: " + dev.rs(45));
			print("Irate compensation K x1000	: " + dev.rs(46));
			break;
		case 250:
			print("Irate compensation Offset	: " + dev.rs(47));
			print("Irate compensation K x1000	: " + dev.rs(48));
			break;
		case 500:
			print("Irate compensation Offset	: " + dev.rs(49));
			print("Irate compensation K x1000	: " + dev.rs(50));	
			break;
		case 750:
			print("Irate compensation Offset	: " + dev.rs(51));
			print("Irate compensation K x1000	: " + dev.rs(52));	
			break;
		case 1000:
			print("Irate compensation Offset	: " + dev.rs(53));
			print("Irate compensation K x1000	: " + dev.rs(54));
			break;
		case 1500:
			print("Irate compensation Offset	: " + dev.rs(55));
			print("Irate compensation K x1000	: " + dev.rs(56));
			break;
		case 2500:
			print("Irate compensation Offset	: " + dev.rs(57));
			print("Irate compensation K x1000	: " + dev.rs(58));
			break;
		case 3000:
			print("Irate compensation Offset	: " + dev.rs(59));
			print("Irate compensation K x1000	: " + dev.rs(60));	
			break;
		case 5000:
			print("Irate compensation Offset	: " + dev.rs(61));
			print("Irate compensation K x1000	: " + dev.rs(62));
			break;
	}
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

function CAL_SetCoefId(P2, P1, P0)
{
	dev.ws(8, Math.round(P2 * 1e6));
	dev.w(7, Math.round(P1 * 1000));
	dev.ws(6, Math.round(P0));	
}
//--------------------

function CAL_SetCoefIdset(P2, P1, P0)
{
	dev.ws(124, Math.round(P2 * 1e6));
	dev.w(123, Math.round(P1 * 1000));
	dev.ws(122, Math.round(P0));	
}
//--------------------

function CAL_PrintCoefId()
{
	print("Id P2 x1e6		: " + dev.rs(8));
	print("Id P1 x1000		: " + dev.rs(7));
	print("Id P0 			: " + dev.rs(6));
}
//--------------------

function CAL_PrintCoefIdset()
{
	print("Idset P2 x1e6	: " + dev.rs(124));
	print("Idset P1 x1000	: " + dev.rs(123));
	print("Idset P0 		: " + dev.rs(122));
}
//--------------------