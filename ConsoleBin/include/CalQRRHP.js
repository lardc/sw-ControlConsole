include("Tektronix.js");
include("TestQRRHP.js")
include("Sic_GetData.js")

// Calibration setup parameters
cal_Rshunt = 1000;	// uOhm
DirectCurrentTest = 400; // in A
DirectVoltageTest = 1500; // in V
DirectVoltageRateTest = 1000; // in V/us
//
CurrentRateTest = [1, 1.5, 2, 5, 10, 15, 20, 30, 50, 60, 100]; // in A/us
IrrMeasured = [25, 35, 43, 83, 130, 170, 200, 248, 320, 345, 345]; // in A
CurrentRateStartTestIndex = 0;
CurrentRateFinishTestIndex = 10;
//
QrrGOST = 0;
//
cal_Iterations = 3;
//		

// Counters
cal_CntTotal = 0;
cal_CntDone = 0;

// Channels
cal_chMeasureI = 1;
cal_chMeasureU = 2;

// Results storage
cal_Trr = [];
cal_Irr = [];
cal_Qrr = [];
cal_Tq = [];

// Tektronix data
cal_TrrSc = [];
cal_IrrSc = [];
cal_QrrSc = [];
cal_TqSc = [];

// Relative error
cal_TrrErr = [];
cal_IrrErr = [];
cal_QrrErr = [];
cal_TqErr = [];


function CAL_Init(portDevice, portTek, channelMeasureI, channelMeasureU)
{
	if (channelMeasureI < 1 || channelMeasureU > 4)
	{
		print("Wrong channel numbers");
		return;
	}

	// Copy channel information
	cal_chMeasureI = channelMeasureI;
	cal_chMeasureU = channelMeasureU;

	// Init device port
	dev.Disconnect();
	dev.Connect(portDevice);

	// Init Tektronix port
	TEK_PortInit(portTek);
	
	// Tektronix init
	for (var i = 1; i <= 4; i++)
	{
		if (i == channelMeasureI || i == channelMeasureU)
			TEK_ChannelOn(i);
		else
			TEK_ChannelOff(i);
	}
}
//--------------------

function CAL_VerifyTq()
{		
	CAL_ResetA();
	
	dev.w(153,1);
	dev.c(110);
	
	// Tektronix init
	CAL_TekInitTq();

	if (CAL_CollectTq(cal_Iterations))
	{
		CAL_SaveTq("QSU_Tq");
		
		// Plot relative error distribution
		scattern(cal_TqSc, cal_TqErr, "Tq (in us)", "Error (in %)", "Tq relative error");
	}
	
	dev.c(111);
}
//--------------------

function CAL_VerifyQrr()
{		
	CAL_ResetA();
	
	dev.w(153,1);
	dev.c(110);
	
	// Tektronix init
	CAL_TekInitQrr();

	if (CAL_CollectQrr(cal_Iterations))
	{
		CAL_SaveIrr("QSU_Irr");
		CAL_SaveTrr("QSU_Trr");
		CAL_SaveQrr("QSU_Qrr");
		
		// Plot relative error distribution
		scattern(cal_IrrSc, cal_IrrErr, "Irr (in A)", "Error (in %)", "Irr relative error");
		scattern(cal_TrrSc, cal_TrrErr, "Trr (in us)", "Error (in %)", "Trr relative error");
		scattern(cal_QrrSc, cal_QrrErr, "Qrr (in uQ)", "Error (in %)", "Qrr relative error");
	}
	
	dev.c(111);
}
//--------------------

function CAL_CollectTq(IterationsCount)
{
	cal_CntTotal = (CurrentRateFinishTestIndex - CurrentRateStartTestIndex) * IterationsCount;
	cal_CntDone = 1;
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = CurrentRateStartTestIndex; j <= CurrentRateFinishTestIndex; j++)
		{
			print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --");
			//
			
			do
			{
				qrr_print = 0;			
				QRR_Start(1, DirectCurrentTest, CurrentRateTest[j], DirectVoltageTest, DirectVoltageRateTest)
				qrr_print = 1;
				
				print("Is cursor set (y - yes, n -no, s - Stop process)?");
				
				var key = "";
				while(key != "y" && key != "n" && key != "s")
				{
					key = readkey();
					sleep(100);
				}
				
				if(key == "s")
					return 0;
			}
			while(key != "y")
			
			// Unit data
			var Tq = dev.r(213) / 10;			
			cal_Tq.push(Tq);
			print("Tq, us	 : " + Tq);

			// Scope data
			var TqSc = CAL_MeasureTq(cal_chMeasureI);
			cal_TqSc.push(TqSc);
			print("TqTek, us : " + TqSc);
			
			// Relative error
			var TqErr = ((Tq - TqSc) / TqSc * 100).toFixed(2);
			cal_TqErr.push(TqErr);
			print("TqErr, %  : " + TqErr);
			
			print("--------------------");
			
			if (anykey()) return 0;
		}
	}

	return 1;
}
//--------------------

function CAL_CollectQrr(IterationsCount)
{
	cal_CntTotal = (CurrentRateFinishTestIndex - CurrentRateStartTestIndex ) * IterationsCount;
	cal_CntDone = 1;
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = CurrentRateStartTestIndex; j <= CurrentRateFinishTestIndex; j++)
		{
			print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --");
			//
			CAL_HorizontalScale(CurrentRateTest[j]);
			CAL_TekScale(cal_chMeasureI, IrrMeasured[j] * cal_Rshunt / 1e6);
			sleep(1000);
			
			qrr_print = 0;
			qrr_single = 1;
			
			QRR_Start(0, DirectCurrentTest, CurrentRateTest[j], DirectVoltageTest, VoltageRateTest)
			
			qrr_print = 1;
			qrr_single = 0;
			
			// Unit data
			var Qrr = Qrr = dev.r(216) / 10;
			if(QrrGOST)
				Qrr = dev.r(210) / 10;				
			cal_Qrr.push(Qrr);
			
			var Irr = dev.r(211);
			cal_Irr.push(Irr);
			
			var Trr = dev.r(212) / 10;
			cal_Trr.push(Trr);
			

			// Scope data
			var ScopeData = CAL_MeasureQrr(cal_chMeasureI);
			var IrrSc = parseFloat(ScopeData[0]).toFixed(2);
			var TrrSc = parseFloat(ScopeData[1]).toFixed(2);
			var QrrSc = parseFloat(ScopeData[2]).toFixed(2);
			if(QrrGOST)
				QrrSc = parseFloat(ScopeData[3]).toFixed(2);			
			cal_IrrSc.push(IrrSc);
			cal_TrrSc.push(TrrSc);
			cal_QrrSc.push(QrrSc);
			
			
			// Relative error
			var IrrErr = ((Irr - IrrSc) / IrrSc * 100).toFixed(2);
			var TrrErr = ((Trr - TrrSc) / TrrSc * 100).toFixed(2);
			var QrrErr = ((Qrr - QrrSc) / QrrSc * 100).toFixed(2);
			
			cal_IrrErr.push(IrrErr);
			cal_TrrErr.push(TrrErr);
			cal_QrrErr.push(QrrErr);
			
			
			
			
			// Print results
			print("");
			print("Irr, A	 : " + Irr);
			print("IrrTek,  A: " + IrrSc);
			print("IrrErr,  %: " + IrrErr);
			print("");
			print("Trr, us	 : " + Trr);
			print("TrrTek, us: " + TrrSc);
			print("TrrErr,  %: " + TrrErr);
			print("");
			print("Qrr, uQ	 : " + Qrr);
			print("QrrTek, uQ: " + QrrSc);
			print("QrrErr,  %: " + QrrErr);
			print("--------------------");
			
			if (anykey()) return 0;
		}
	}

	return 1;
}
//--------------------

function CAL_MeasureQrr(Channel)
{
	var CurrentScale = 0, Current = 0, IntegratedCurrent = 0;
	var Index0 = 0, Index09 = 0, Index025 = 0, IndexIrr = 0, IndexTrr = 0;
	var k = 0, b = 0, TimeFraction;
	var Result = [];
	var ResultIrr, ResultTrr, ResultQrr, ResultQrrGOST;
	
	// Get waveform
	CurrentScale = 1 / cal_Rshunt * 1e6;
	Current = SiC_GD_Filter(SiC_GD_GetChannelCurve(Channel), CurrentScale);
	
	TimeFraction = SiC_GD_GetTimeScale() / 250 * 1e9  / 1000;
	
	// Searching zero crossing point
	for(i = 0; i < Current.length; i++)
	{
		if(Current[i] < 0)
		{
			Index0 = i;
			break;
		}
	}
	
	// Searching Irr point
	for(i = Index0; i < Current.length; i++)
	{
		if(Current[i] < Current[IndexIrr])
			IndexIrr = i;
	}
	
	// Searching Irr * 0.9 point
	for(i = IndexIrr; i < Current.length; i++)
	{
		if(Current[i] > Current[IndexIrr] * 0.9)
		{
			Index09 = i;
			break;
		}
	}
	
	// Searching Irr * 0.25 point
	for(i = IndexIrr; i < Current.length; i++)
	{
		if(Current[i] > Current[IndexIrr] * 0.25)
		{
			Index025 = i;
			break;
		}
	}
	
	// Irr
	ResultIrr =  -Current[IndexIrr];
	
	// Trr calculate
	b = Current[Index09];
	k = (Current[Index025] - Current[Index09]) / (Index025 - Index09);
	IndexTrr = Math.round(-b / k + Index09);
	ResultTrr = ((IndexTrr - Index0) * TimeFraction).toFixed(2);
	
	// Qrr calculate
	for(i = Index0; i < IndexTrr; i++)
		IntegratedCurrent += -Current[i];
	ResultQrr = (IntegratedCurrent * TimeFraction).toFixed(2);
	ResultQrrGOST = (ResultIrr * ResultTrr / 2).toFixed(2);
	
	var ReturnValues = [];
	ReturnValues[0] = ResultIrr;
	ReturnValues[1] = ResultTrr;
	ReturnValues[2] = ResultQrr;
	ReturnValues[3] = ResultQrrGOST;
	
	return ReturnValues;
}
//--------------------

function CAL_MeasureTq(Channel)
{
	TEK_Send("cursor:select:source ch" + Channel);
	sleep(500);
	return TEK_Exec("cursor:vbars:delta?") * 1e6;
}
//--------------------

function CAL_ResetA()
{	
	// Results storage
	cal_Irr = [];
	cal_Trr = [];
	cal_Qrr = [];
	cal_Tq = [];

	// Tektronix data
	cal_IrrSc = [];
	cal_TrrSc = [];
	cal_QrrSc = [];
	cal_TqSc = [];

	// Relative error
	cal_IrrErr = [];
	cal_TrrErr = [];
	cal_QrrErr = [];
	cal_TqErr = [];
}
//--------------------

function CAL_SaveIrr(NameIrr)
{
	CGEN_SaveArrays(NameIrr, cal_Irr, cal_IrrSc, cal_IrrErr);
}
//--------------------

function CAL_SaveTrr(NameTrr)
{
	CGEN_SaveArrays(NameTrr, cal_Trr, cal_TrrSc, cal_TrrErr);
}
//--------------------

function CAL_SaveQrr(NameQrr)
{
	CGEN_SaveArrays(NameQrr, cal_Qrr, cal_QrrSc, cal_QrrErr);
}
//--------------------

function CAL_SaveTq(NameTq)
{
	CGEN_SaveArrays(NameTq, cal_Tq, cal_TqSc, cal_TqErr);
}
//--------------------

function CAL_TekInitQrr()
{
	TEK_Horizontal("1e-6", "0");
	
	TEK_ChannelInvInit(cal_chMeasureI, "1", "0.1");
	TEK_Send("ch" + cal_chMeasureI + ":position 3");
	
	TEK_ChannelInit(cal_chMeasureU, "100", "20");
	TEK_Send("ch" + cal_chMeasureU + ":position 3");
	
	TEK_TriggerInit(cal_chMeasureU, "-60");
	TEK_Send("trigger:main:edge:slope fall");
	
	TEK_Send("data:width 1");
	TEK_Send("data:encdg rpb");
	TEK_Send("data:start 1");
	TEK_Send("data:stop 2500");
}
//--------------------

function CAL_TekInitTq()
{
	TEK_Horizontal("10e-6", "0");
	
	TEK_ChannelInvInit(cal_chMeasureI, "1", "0.1");
	TEK_Send("ch" + cal_chMeasureI + ":position 0");
	
	TEK_ChannelInit(cal_chMeasureU, "100", "50");
	TEK_Send("ch" + cal_chMeasureU + ":position -1");
	
	TEK_TriggerInit(cal_chMeasureI, "0");
	TEK_Send("trigger:main:edge:slope raise");
}
//--------------------

function CAL_TekScale(Channel, Value)
{
	Value = Value / 6;
	TEK_Send("ch" + Channel + ":scale " + Value);
}
//--------------------

function CAL_HorizontalScale(CurrentRate)
{
	switch(CurrentRate * 10)
	{
		case 10:
			TEK_Horizontal("10e-6", "0");
			break;
		case 15:
			TEK_Horizontal("10e-6", "0");
			break;
		case 20:
			TEK_Horizontal("5e-6", "0");
			break;
		case 50:
			TEK_Horizontal("5e-6", "0");
			break;
		case 100:
			TEK_Horizontal("5e-6", "0");
			break;
		case 150:
			TEK_Horizontal("5e-6", "0");
			break;
		case 200:
			TEK_Horizontal("5e-6", "0");
			break;
		case 300:
			TEK_Horizontal("2.5e-6", "0");
			break;
		case 500:
			TEK_Horizontal("2.5e-6", "0");
			break;
		case 600:
			TEK_Horizontal("2.5e-6", "0");
			break;
		case 1000:
			TEK_Horizontal("2.5e-6", "0");
			break;
	}
}
//--------------------