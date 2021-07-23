include("Tektronix.js");
include("TestQRRHP.js")
include("Sic_GetData.js")

// Calibration setup parameters
cal_Rshunt = 1000;	// uOhm
cal_Points = 10;
//
DirectCurrentTest = 400; // in A
CurrentRateTest = [1, 1.5, 2, 5, 10, 15, 20, 30, 50, 60, 100]; // in A/us
CurrentRateStartTestIndex = 3;
IrrMeasured = [15, 20, 27, 57, 100, 130, 160, 200, 250, 300, 300]; // in A
//
QrrGOST = 0;
//
cal_Iterations = 1;
//		

// Counters
cal_CntTotal = 0;
cal_CntDone = 0;

// Channels
cal_chMeasureQrr = 1;
cal_chMeasureU = 2;

// Results storage
cal_trr = [];
cal_Irr = [];
cal_Qrr = [];

// Tektronix data
cal_trrSc = [];
cal_IrrSc = [];
cal_QrrSc = [];

// Relative error
cal_trrErr = [];
cal_IrrErr = [];
cal_QrrErr = [];


function CAL_Init(portDevice, portTek, channelMeasureI, channelMeasureU)
{
	if (channelMeasureI < 1 || channelMeasureU > 4)
	{
		print("Wrong channel numbers");
		return;
	}

	// Copy channel information
	cal_chMeasureQrr = channelMeasureI;
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
		CAL_Savetrr("QSU_trr");
		CAL_SaveQrr("QSU_Qrr");
		
		// Plot relative error distribution
		scattern(cal_IrrSc, cal_IrrErr, "Irr (in A)", "Error (in %)", "Irr relative error");
		scattern(cal_trrSc, cal_trrErr, "trr (in us)", "Error (in %)", "trr relative error");
		scattern(cal_QrrSc, cal_QrrErr, "Qrr (in uQ)", "Error (in %)", "Qrr relative error");
	}
	
	dev.c(111);
}
//--------------------

function CAL_CollectQrr(IterationsCount)
{
	cal_CntTotal = (CurrentRateTest.length - CurrentRateStartTestIndex ) * IterationsCount;
	cal_CntDone = 1;
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = CurrentRateStartTestIndex; j < CurrentRateTest.length; j++)
		{
			print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --");
			//
			CAL_HorizontalScale(CurrentRateTest[j]);
			CAL_TekScale(cal_chMeasureQrr, IrrMeasured[j] * cal_Rshunt / 1e6);
			sleep(1000);
			
			qrr_print = 0;
			qrr_single = 1;
			
			QRR_Start(0, DirectCurrentTest, CurrentRateTest[j], 1000, 400)
			
			qrr_print = 1;
			qrr_single = 0;
			
			// Unit data
			var Qrr = Qrr = dev.r(216) / 10;
			if(QrrGOST)
				Qrr = dev.r(210) / 10;				
			cal_Qrr.push(Qrr);
			
			var Irr = dev.r(211);
			cal_Irr.push(Irr);
			
			var trr = dev.r(212) / 10;
			cal_trr.push(trr);
			

			// Scope data
			var ScopeData = CAL_MeasureQrr(cal_chMeasureQrr);
			var IrrSc = parseFloat(ScopeData[0]).toFixed(2);
			var trrSc = parseFloat(ScopeData[1]).toFixed(2);
			var QrrSc = parseFloat(ScopeData[2]).toFixed(2);
			if(QrrGOST)
				QrrSc = parseFloat(ScopeData[3]).toFixed(2);
			
			IrrSc = Irr;
			trrSc = trr;
			QrrSc = Irr * trr / 2;
			
			cal_IrrSc.push(IrrSc);
			cal_trrSc.push(trrSc);
			cal_QrrSc.push(QrrSc);
			
			
			// Relative error
			var IrrErr = ((Irr - IrrSc) / IrrSc * 100).toFixed(2);
			var trrErr = ((trr - trrSc) / trrSc * 100).toFixed(2);
			var QrrErr = ((Qrr - QrrSc) / QrrSc * 100).toFixed(2);
			cal_IrrErr.push(IrrErr);
			cal_trrErr.push(trrErr);
			cal_QrrErr.push(QrrErr);
			
			
			// Print results
			print("");
			print("Irr, A	 : " + Irr);
			print("IrrTek,  A: " + IrrSc);
			print("IrrErr,  %: " + IrrErr);
			print("");
			print("trr, us	 : " + trr);
			print("trrTek, us: " + trrSc);
			print("trrErr,  %: " + trrErr);
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
	var Index0 = 0, Index09 = 0, Index025 = 0, IndexIrr = 0, Indextrr = 0;
	var k = 0, b = 0, TimeFraction;
	var Result = [];
	var ResultIrr, Resulttrr, ResultQrr, ResultQrrGOST;
	
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
	
	// trr calculate
	b = Current[Index09];
	k = (Current[Index025] - Current[Index09]) / (Index025 - Index09);
	Indextrr = Math.round(-b / k + Index09);
	Resulttrr = ((Indextrr - Index0) * TimeFraction).toFixed(2);
	
	// Qrr calculate
	for(i = Index0; i < Indextrr; i++)
		IntegratedCurrent += -Current[i];
	ResultQrr = (IntegratedCurrent * TimeFraction).toFixed(2);
	ResultQrrGOST = (ResultIrr * Resulttrr / 2).toFixed(2);
	
	var ReturnValues = [];
	ReturnValues[0] = ResultIrr;
	ReturnValues[1] = Resulttrr;
	ReturnValues[2] = ResultQrr;
	ReturnValues[3] = ResultQrrGOST;
	
	return ReturnValues;
}
//--------------------

function CAL_ResetA()
{	
	// Results storage
	cal_Irr = [];
	cal_trr = [];
	cal_Qrr = [];

	// Tektronix data
	cal_IrrSc = [];
	cal_trrSc = [];
	cal_QrrSc = [];

	// Relative error
	cal_IrrErr = [];
	cal_trrErr = [];
	cal_QrrErr = [];
}
//--------------------

function CAL_SaveIrr(NameIrr)
{
	CGEN_SaveArrays(NameIrr, cal_Irr, cal_IrrSc, cal_IrrErr);
}
//--------------------

function CAL_Savetrr(Nametrr)
{
	CGEN_SaveArrays(Nametrr, cal_trr, cal_trrSc, cal_trrErr);
}
//--------------------

function CAL_SaveQrr(NameQrr)
{
	CGEN_SaveArrays(NameQrr, cal_Qrr, cal_QrrSc, cal_QrrErr);
}
//--------------------

function CAL_TekInitQrr()
{
	TEK_Horizontal("1e-6", "0");
	
	TEK_ChannelInvInit(cal_chMeasureQrr, "1", "0.1");
	TEK_Send("ch" + cal_chMeasureQrr + ":position 3");
	
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