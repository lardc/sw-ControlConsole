include("Tektronix.js")
include("CalGeneral.js")


//-------------------------------------------------------------------------------------------------------------------------------------------
//Блок задания параметров формирования в DCU
function CONFIG_UNIT(Unit, Current, CurrentRate)
{

	dev.nid(Unit);
	dev.w(128, Current);
	dev.w(129, CurrentRate);
	if(dev.r(192) == 3)
		{

		dev.c(100);

		}
}

//-------------------------------------------------------------------------------------------------------------------------------------------
//Аdditional Functions 
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
	
	// Data arrays
	cdcu_scatter = [];
}

//--------------------

function CAL_TekInitId()
{
	TEK_ChannelInit(cal_chMeasureId, "1", "0.02");
	TEK_TriggerInit(cal_chMeasureId, "0.06");
	TEK_Send("trigger:main:edge:slope fall");
	TEK_Horizontal("0.5e-3", "0.4e-3");
	TEK_Send("measurement:meas" + cal_chMeasureId + ":source ch" + cal_chMeasureId);
	TEK_Send("measurement:meas" + cal_chMeasureId + ":type maximum");
}

//--------------------

function CAL_CollectId(CurrentValues, IterationsCount, CurrentRateNTest)
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
			DCU_TekScaleId(cal_chMeasureId, CurrentValues[j] * UnitEn * cal_Rshunt / 1000000);
			sleep(800);
			while (dev.r(197) !=0)
				{
					sleep(500);
				}
		
			for (var k = 0; k < AvgNum; k++)
				{
				DRCU_Pulse(CurrentValues[j], CurrentRateNTest );
				}

			// Unit data
			dev.nid(160);
			var Id = dev.r(202) * UnitEn / 10;
			cal_Id.push(Id);
			print("Id, A: " + Id);
			
			var IdSet = dev.r(128) * UnitEn;
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

function CAL_SaveId(NameId)
{
	CGEN_SaveArrays(NameId, cal_Id, cal_IdSc, cal_IdErr);
}

//--------------------

function DCU_TekScaleId(Channel, Value)
{
	Value = Value / 7;
	TEK_Send("ch" + Channel + ":scale " + Value);
	TEK_TriggerInit(cal_chMeasureId, Value * 6);
	TEK_Send("trigger:main:edge:slope fall");
}

//--------------------

function CAL_MeasureId(Channel)
{
	return (TEK_Exec("measurement:meas1:value?") * 1000).toFixed(1);
}


//--------------------

function CAL_TekInitIrate()
{
	TEK_ChannelInit(cal_chMeasureId, "1", "0.02");
	TEK_TriggerInit(cal_chMeasureId, "0.06");
	TEK_Send("ch" + cal_chMeasureId + ":position -4");
	TEK_Send("trigger:main:edge:slope fall");
	TEK_Send("measurement:meas" + cal_chMeasureId + ":source ch" + cal_chMeasureId);
	TEK_Send("measurement:meas" + cal_chMeasureId + ":type maximum");
	TEK_Send("measurement:meas1:source ch" + cal_chMeasureId);
	TEK_Send("measurement:meas1:type maximum");
	TEK_Send("measurement:meas2:source ch" + cal_chMeasureId);
	TEK_Send("measurement:meas2:type fall");
	TEK_Send("CURSor:HBArs:POSITION 0.1");
	CAL_TekSetHorizontalScale();
}

//--------------------

function CAL_TekSetHorizontalScale()
{
	switch(CurrentRateN)

	{
		case 0:
			TEK_Horizontal("100e-6", "0");
			break;
		case 1:
			TEK_Horizontal("100e-6", "0");
			break;
		case 2:
			TEK_Horizontal("50e-6", "0");
			break;
		case 3:
			TEK_Horizontal("25e-6", "0");
			break;
		case 4:
			TEK_Horizontal("10e-6", "0");
			break;
		case 5:
			TEK_Horizontal("10e-6", "0");
			break;
		case 6:
			TEK_Horizontal("5e-6", "0");
			break;
		case 7:
			TEK_Horizontal("5e-6", "0");
			break;
		case 8:
			TEK_Horizontal("2.5e-6", "0");
			break;
		case 9:
			TEK_Horizontal("2.5e-6", "0");
			break;
		case 10:
			TEK_Horizontal("1e-6", "0");
			break;
	}
}

//--------------------

function CAL_CollectIrate(CurrentValues, IterationsCount, CurrentRateNTest)
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
	
	cal_IdSc = [];
	cal_IdsetErr = [];
	cal_IrateErr = [];
	

	for (var i = 0; i < IterationsCount; i++)
	{
		
			for (var j = 0; j < CurrentValues.length; j++)
			{
				print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --");

				DCU_TekScaleId(cal_chMeasureId, CurrentValues[j] * UnitEn * cal_Rshunt * 1e-6);
				TEK_Send("horizontal:scale "  + ((CurrentValues[j] * UnitEn / CurrentRate[CurrentRateNTest]) * 1e-6) * 0.25 / UnitEn);
				TEK_Send("horizontal:main:position "+ ((CurrentValues[j] * UnitEn / CurrentRate[CurrentRateNTest]) * 1e-6) * 0.4 / UnitEn);
				sleep(100);
				while (dev.r(197) !=0)
				{
					p(dev.r(197));
					sleep(500);
				}
				for (var m = 0; m < AvgNum; m++)
				{
					DRCU_Pulse(CurrentValues[j], CurrentRateN[CurrentRateNTest])
				}
				sleep(1000);
				
				CAL_MeasureIrate(CurrentRate[CurrentRateNTest] * UnitEn, CurrentValues[j] * UnitEn);
				if (anykey()) return 0;
			}
			//scattern(cal_IdSc, cal_IrateErr, "Current (in A)", "Error (in %)", "DCU Current rate relative error " + CurrentRate[k] + " A/us");
			//scattern(cal_IdSc, cal_IdsetErr, "Current (in A)", "Error (in %)", "DCU Set current relative error " + CurrentRateTest[k] + " A/us");
				
	}
			scattern(cal_IdSc, cal_IrateErr, "Current (in A)", "Error (in %)", "DCU Current rate relative error " + CurrentRate[CurrentRateNTest] * UnitEn + " A/us");
	save("data/dcu_404.csv", cdcu_scatter);
	return 1;
}

//--------------------

function CAL_MeasureIrate(RateSet, CurrentSet)
{
	var RateScope = (TEK_Measure(cal_chMeasureId) * 0.8 / cal_Rshunt * 1e6 / TEK_Exec("measurement:meas2:value?") * 1e-6).toFixed(3);
	var RateErr = ((RateScope - RateSet) / RateSet * 100).toFixed(2);
	
	var CurrentScope = (TEK_Measure(cal_chMeasureId) / (cal_Rshunt * 1e-6)).toFixed(2);
	var CurrentErr = ((CurrentScope - CurrentSet) / CurrentSet * 100).toFixed(2);
	
	cdcu_scatter.push(RateSet + ";" + RateScope + ";" + RateErr + ";" + CurrentSet + ";" + CurrentScope + ";" + CurrentErr);
	
	cal_IdSc.push(CurrentScope);
	cal_IdsetErr.push(CurrentErr);
	cal_IrateErr.push(RateErr);

	print("Current Set, A = " + CurrentSet);	
	print("Current Osc, A = " + CurrentScope);	
	print("Current Err, % = " + CurrentErr);
	
	print("Voltage, V = " + dev.r(201));
	print("di/dt Set, A/us = " + RateSet);	
	print("di/dt Osc, A/us = " + RateScope);	
	print("di/dt Err, % = " + RateErr);

	return RateScope;	
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

function CAL_SaveIdset(NameIdset)
{
	CGEN_SaveArrays(NameIdset, cal_IdSc, cal_Idset, cal_IdsetErr);
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

function CAL_CompensationIrate(CurrentValues, CurrentRateNTest)
{	
	cal_CntTotal = CurrentValues.length;
	cal_CntDone = 1;
		

	var AvgNum, VoltageMin, VoltageMax, Voltage;
	
	if (cal_UseAvg)
		AvgNum = 4;
	else
		AvgNum = 1;

	for (var j = 0; j < CurrentValues.length; j++)
	{
		
		print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --");
		
		VoltageMin = cal_IntPsVmin;
		VoltageMax = cal_IntPsVmax;

		DCU_TekScaleId(cal_chMeasureId, CurrentValues[j] * cal_Rshunt * 1e-6);
		TEK_Send("horizontal:scale "  + ((CurrentValues[j] / CurrentRate[CurrentRateNTest]) * 1e-6) * 0.25);
		TEK_Send("horizontal:main:position "+ ((CurrentValues[j] / CurrentRate[CurrentRateNTest]) * 1e-6) * 0.4);

		for (var i = 0; i < cal_Points; i++)
		{
			TEK_AcquireSample();
			TEK_AcquireAvg(AvgNum);
		
			Voltage = Math.round((VoltageMin + (VoltageMax - VoltageMin) / 2) * 10) / 10;
			
			dev.w(130, Voltage * 10);
			p("Voltage DCU : " + Voltage);
			p("Current, A : " + CurrentValues[j]);
			p("VintPS max : " + VoltageMax);
			p("VintPS,  V : " + Voltage);
			p("VintPS min : " + VoltageMin);
			p("-------------");
			
			for (var n = 0; n < AvgNum; n++)
				if(!DRCU_Pulse(CurrentValues[j], CurrentRateN[CurrentRateNTest]))
					return 0;				

			
			var IrateSc = CAL_MeasureIrate(CurrentRate[CurrentRateNTest],CurrentValues[j]);
			
			if(IrateSc < CurrentRate[CurrentRateNTest])

				VoltageMin = Voltage;

			else
			{
				if(IrateSc > CurrentRate[CurrentRateNTest])

					VoltageMax = Voltage;
				else
					break;
			
			if((VoltageMin + 0.2) >= VoltageMax)
				break;
			
			if (anykey()) return 0;

			}
		}
		cal_Idset.push(CurrentValues[j]);
		cal_VintPS.push(Voltage * 10);
	}	
	dev.w(130, 0);	
	return 1;
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
	
	switch(CurrentRateN[k])
	{
		case 0:
			dev.ws(41, Offset);
			dev.ws(42, K * 1000);
			break;
		case 1:
			dev.ws(43, Offset);
			dev.ws(44, K * 1000);
			break;
		case 2:
			dev.ws(45, Offset);
			dev.ws(46, K * 1000);
			break;
		case 3:
			dev.ws(47, Offset);
			dev.ws(48, K * 1000);
			break;
		case 4:
			dev.ws(49, Offset);
			dev.ws(50, K * 1000);
			break;
		case 5:
			dev.ws(51, Offset);
			dev.ws(52, K * 1000);
			break;
		case 6:
			dev.ws(53, Offset);
			dev.ws(54, K * 1000);
			break;
		case 7:
			dev.ws(55, Offset);
			dev.ws(56, K * 1000);
			break;
		case 8:
			dev.ws(57, Offset);
			dev.ws(58, K * 1000);
			break;
		case 9:
			dev.ws(59, Offset);
			dev.ws(60, K * 1000);
			break;
		case 10:
			dev.ws(61, Offset);
			dev.ws(62, K * 1000);
			break;
	}
}

//--------------------

function CAL_PrintCoefIrateCompens()
{
	switch(CurrentRateN[k])
	{
		case 0:
			print("Irate compensation Offset	: " + dev.rs(41));
			print("Irate compensation K x1000	: " + dev.rs(42));
			break;
		case 1:
			print("Irate compensation Offset	: " + dev.rs(43));
			print("Irate compensation K x1000	: " + dev.rs(44));
			break;
		case 2:
			print("Irate compensation Offset	: " + dev.rs(45));
			print("Irate compensation K x1000	: " + dev.rs(46));
			break;
		case 3:
			print("Irate compensation Offset	: " + dev.rs(47));
			print("Irate compensation K x1000	: " + dev.rs(48));
			break;
		case 4:
			print("Irate compensation Offset	: " + dev.rs(49));
			print("Irate compensation K x1000	: " + dev.rs(50));	
			break;
		case 5:
			print("Irate compensation Offset	: " + dev.rs(51));
			print("Irate compensation K x1000	: " + dev.rs(52));	
			break;
		case 6:
			print("Irate compensation Offset	: " + dev.rs(53));
			print("Irate compensation K x1000	: " + dev.rs(54));
			break;
		case 7:
			print("Irate compensation Offset	: " + dev.rs(55));
			print("Irate compensation K x1000	: " + dev.rs(56));
			break;
		case 8:
			print("Irate compensation Offset	: " + dev.rs(57));
			print("Irate compensation K x1000	: " + dev.rs(58));
			break;
		case 9:
			print("Irate compensation Offset	: " + dev.rs(59));
			print("Irate compensation K x1000	: " + dev.rs(60));	
			break;
		case 10:
			print("Irate compensation Offset	: " + dev.rs(61));
			print("Irate compensation K x1000	: " + dev.rs(62));
			break;
	}
}

//--------------------