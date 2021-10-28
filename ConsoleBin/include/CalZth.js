include("TestZth.js")
include("Instek.js")
include("CalGeneral.js")

// Calibration setup parameters
cal_Points = 10;

cal_Rshunt = 50;	// in mOhm

cal_ImMin = 500;	
cal_ImMax = 5000;
cal_ImStp = (cal_ImMax - cal_ImMin) / cal_Points;

cal_IgMin = 500;	
cal_IgMax = 3000;
cal_IgStp = (cal_IgMax - cal_IgMin) / cal_Points;

cal_IhRange = 1;
cal_IhMin = [50, 501];	
cal_IhMax = [500, 2500];
cal_IhStp = (cal_IhMax[cal_IhRange] - cal_IhMin[cal_IhRange]) / cal_Points;

cal_UdMin = 300;	
cal_UdMax = 4500;
cal_UdStp = (cal_UdMax - cal_UdMin) / cal_Points;

cal_Iterations = 10;
//		

// Counters
cal_CntTotal = 0;
cal_CntDone = 0;

// Results storage
cal_Ud = [];
cal_Im = [];
cal_Ih = [];
cal_ImSet = [];
cal_IhSet = [];
cal_IgSet = [];

// Instek data
cal_UdInst = [];
cal_ImInst = [];
cal_IgInst = [];
cal_IhInst = [];

// Relative error
cal_UdErr = [];
cal_ImErr = [];
cal_IhErr = [];
cal_ImSetErr = [];
cal_IhSetErr = [];
cal_IgSetErr = [];

// Correction
cal_UdCorr = [];
cal_ImCorr = [];
cal_IgCorr = [];
cal_IhCorr = [];


ErrorArray = [];
VoltageArray = [];

function Zth_Test(Voltage, N)
{	
	VoltageArray = [];
	ErrorArray = [];
	
	for(i = 0; i < N; i++)
	{
		Zth_TSP(Voltage);
		sleep(1500);
		dev.c(12);		
		
		var Vinst = (Instek_ReadDisplayValue() * 1000).toFixed(2);
		var Vdev = dev.r(150) / 10;
		var Error = ((Vdev - Vinst) / Vinst * 100).toFixed(2);
		ErrorArray.push(Error);
		VoltageArray.push(Voltage);
		
		p(Vdev);
	}
	scattern(VoltageArray, ErrorArray, "Current (in mA)", "Error (in %)", "Current relative error");
}

function CAL_Init(portDevice, portInstek)
{
	// Init device port
	dev.Disconnect();
	dev.Connect(portDevice);

	// Init Instek port
	TEK_PortInit(portInstek);

}
//--------------------

function CAL_CalibrateUd()
{		
	CAL_ResetA();
	CAL_ResetUdCal();

	// Reload values
	var VoltageArray = CGEN_GetRange(cal_UdMin, cal_UdMax, cal_UdStp);

	if (CAL_CollectUd(VoltageArray, cal_Iterations))
	{
		CAL_SaveUd("Zth_Ud");

		// Plot relative error distribution
		scattern(cal_UdInst, cal_UdErr, "Voltage (in mV)", "Error (in %)", "Voltage relative error");

		// Calculate correction
		cal_UdCorr = CGEN_GetCorrection2("Zth_Ud");
		CAL_SetCoefUd(cal_UdCorr[0], cal_UdCorr[1], cal_UdCorr[2]);
		CAL_PrintCoefUd();
	}
}
//--------------------

function CAL_CalibrateIm()
{		
	CAL_ResetA();
	CAL_ResetImCal();

	// Reload values
	var CurrentArray = CGEN_GetRange(cal_ImMin, cal_ImMax, cal_ImStp);

	if (CAL_CollectIm(CurrentArray, cal_Iterations))
	{
		CAL_SaveIm("Zth_Im");

		// Plot relative error distribution
		scattern(cal_ImInst, cal_ImErr, "Current (in mA)", "Error (in %)", "Current relative error");

		// Calculate correction
		cal_ImCorr = CGEN_GetCorrection2("Zth_Im");
		CAL_SetCoefIm(cal_ImCorr[0], cal_ImCorr[1], cal_ImCorr[2]);
		CAL_PrintCoefIm();
	}
}
//--------------------

function CAL_CalibrateIg()
{		
	CAL_ResetA();
	CAL_ResetIgCal();

	// Reload values
	var CurrentArray = CGEN_GetRange(cal_IgMin, cal_IgMax, cal_IgStp);

	if (CAL_CollectIg(CurrentArray, cal_Iterations))
	{
		CAL_SaveIg("Zth_Ig");

		// Plot relative error distribution
		scattern(cal_IgSet, cal_IgSetErr, "Current (in mA)", "Error (in %)", "Current relative error");

		// Calculate correction
		cal_IgCorr = CGEN_GetCorrection2("Zth_Ig");
		CAL_SetCoefIg(cal_IgCorr[0], cal_IgCorr[1], cal_IgCorr[2]);
		CAL_PrintCoefIg();
	}
}
//--------------------

function CAL_CalibrateIh()
{		
	CAL_ResetA();
	CAL_ResetIhCal();

	// Reload values
	var CurrentArray = CGEN_GetRange(cal_IhMin[cal_IhRange], cal_IhMax[cal_IhRange], cal_IhStp);

	if (CAL_CollectIh(CurrentArray, cal_Iterations))
	{
		CAL_SaveIh("Zth_Ih");

		// Plot relative error distribution
		scattern(cal_IhInst, cal_IhErr, "Current (in A)", "Error (in %)", "Current relative error");

		// Calculate correction
		cal_IhCorr = CGEN_GetCorrection2("Zth_Ih");
		CAL_SetCoefIh(cal_IhCorr[0], cal_IhCorr[1], cal_IhCorr[2]);
		CAL_PrintCoefIh();
	}
}
//--------------------

function CAL_VerifyUd()
{		
	CAL_ResetA();

	// Reload values
	var VoltageArray = CGEN_GetRange(cal_UdMin, cal_UdMax, cal_UdStp);

	if (CAL_CollectUd(VoltageArray, cal_Iterations))
	{
		CAL_SaveUd("Zth_Ud_fixed");

		// Plot relative error distribution
		scattern(cal_UdInst, cal_UdErr, "Voltage (in mV)", "Error (in %)", "Voltage relative error");
	}
}
//--------------------

function CAL_VerifyIm()
{		
	CAL_ResetA();

	// Reload values
	var CurrentArray = CGEN_GetRange(cal_ImMin, cal_ImMax, cal_ImStp);

	if (CAL_CollectIm(CurrentArray, cal_Iterations))
	{
		CAL_SaveIm("Zth_Im_fixed");

		// Plot relative error distribution
		scattern(cal_ImInst, cal_ImErr, "Current (in mA)", "Error (in %)", "Current relative error");
		scattern(cal_ImSet, cal_ImSetErr, "Current (in mA)", "Error (in %)", "Set current relative error");
	}
}
//--------------------

function CAL_VerifyIg()
{		
	CAL_ResetA();

	// Reload values
	var CurrentArray = CGEN_GetRange(cal_IgMin, cal_IgMax, cal_IgStp);

	if (CAL_CollectIg(CurrentArray, cal_Iterations))
	{
		CAL_SaveIg("Zth_Ig_fixed");

		// Plot relative error distribution
		scattern(cal_IgSet, cal_IgSetErr, "Current (in mA)", "Error (in %)", "Set current relative error");
	}
}
//--------------------

function CAL_VerifyIh()
{		
	CAL_ResetA();

	// Reload values
	var CurrentArray = CGEN_GetRange(cal_IhMin[cal_IhRange], cal_IhMax[cal_IhRange], cal_IhStp);

	if (CAL_CollectIh(CurrentArray, cal_Iterations))
	{
		CAL_SaveIh("Zth_Ih_fixed");

		// Plot relative error distribution
		scattern(cal_IhInst, cal_IhErr, "Current (in A)", "Error (in %)", "Current relative error");
		scattern(cal_IhSet, cal_IhSetErr, "Current (in A)", "Error (in %)", "Set current relative error");
	}
}
//--------------------

function CAL_CollectUd(VoltageValues, IterationsCount)
{
	cal_CntTotal = IterationsCount * VoltageValues.length;
	cal_CntDone = 1;
	
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < VoltageValues.length; j++)
		{
			//CAL_InstekSetVoltageRange(VoltageValues[j]);

			print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --");
			//

			dev.w(150, VoltageValues[j] * 0.83);
			dev.c(21);
			sleep(1500);
			dev.c(12);

			// Unit data
			var UdRead = dev.r(150) / 10;
			cal_Ud.push(UdRead);
			print("UdRead,   mV: " + UdRead);

			// Instek data
			var UdInstek = (Instek_ReadDisplayValue() * 1000).toFixed(2);
			cal_UdInst.push(UdInstek);
			print("UdInstek, mV: " + UdInstek);

			// Relative error
			var UdErr = ((UdRead - UdInstek) / UdInstek * 100).toFixed(2);
			cal_UdErr.push(UdErr);
			print("Uderr,   %: " + UdErr);
			print("--------------------");

			if (anykey()) return 0;
		}
		
		dev.w(150, 0);
		dev.c(21);
		sleep(1500);
		dev.c(12);
	}

	return 1;
}
//--------------------

function CAL_CollectIm(CurrentValues, IterationsCount)
{
	cal_CntTotal = IterationsCount * CurrentValues.length;
	cal_CntDone = 1;
	
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < CurrentValues.length; j++)
		{
			CAL_InstekSetCurrentRange(CurrentValues[j]);

			print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --");
			//

			Zth_Im(CurrentValues[j], 1e6);
			sleep(1500);

			// Unit data
			var ImSet = CurrentValues[j];
			cal_ImSet.push(ImSet);
			print("ImSet,  mA: " + ImSet);
			
			var ImRead = dev.r(203) / 10;
			cal_Im.push(ImRead);
			print("Imread, mA: " + ImRead);

			// Instek data
			var ImInstek = (Instek_ReadDisplayValue() / cal_Rshunt * 1e6).toFixed(2);
			cal_ImInst.push(ImInstek);
			print("Iminst, mA: " + ImInstek);

			// Relative error
			var ImErr = ((ImRead - ImInstek) / ImInstek * 100).toFixed(2);
			cal_ImErr.push(ImErr);
			print("Imerr,   %: " + ImErr);
			
			var ImSetErr = ((ImInstek - ImSet) / ImSet * 100).toFixed(2);
			cal_ImSetErr.push(ImSetErr);
			print("ImSeterr,%: " + ImSetErr);
			print("--------------------");

			if (anykey()) return 0;
		}
	}

	return 1;
}
//--------------------

function CAL_CollectIg(CurrentValues, IterationsCount)
{
	cal_CntTotal = IterationsCount * CurrentValues.length;
	cal_CntDone = 1;
	
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < CurrentValues.length; j++)
		{
			CAL_InstekSetCurrentRange(CurrentValues[j]);

			print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --");
			//

			Zth_Gate(0, CurrentValues[j], true);
			sleep(1500);

			// Unit data
			var IgSet = CurrentValues[j];
			cal_IgSet.push(IgSet);
			print("IgSet,  mA: " + IgSet);

			// Instek data
			var IgInstek = (Instek_ReadDisplayValue() / cal_Rshunt * 1e6).toFixed(2);
			cal_IgInst.push(IgInstek);
			print("Iginst, mA: " + IgInstek);

			// Relative error			
			var IgSetErr = ((IgInstek - IgSet) / IgSet * 100).toFixed(2);
			cal_IgSetErr.push(IgSetErr);
			print("IgSeterr,%: " + IgSetErr);
			print("--------------------");

			if (anykey()) return 0;
		}
	}
	
	Zth_Gate(0, cal_IgMin, false);

	return 1;
}
//--------------------

function CAL_CollectIh(CurrentValues, IterationsCount)
{
	cal_CntTotal = IterationsCount * CurrentValues.length;
	cal_CntDone = 1;
	
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < CurrentValues.length; j++)
		{
			CAL_InstekSetCurrentRange(CurrentValues[j]);

			print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --");
			//

			Zth_Ih(CurrentValues[j], 1e6);
			sleep(1500);

			// Unit data
			var IhSet = CurrentValues[j];
			cal_IhSet.push(IhSet);
			print("IhSet,  A: " + IhSet);
			
			var IhRead = dev.r(201) / 10;
			cal_Ih.push(IhRead);
			print("Ihread, A: " + IhRead);

			// Instek data
			var IhInstek = (Instek_ReadDisplayValue() / cal_Rshunt / 1.5 * 1e6).toFixed(2);
			cal_IhInst.push(IhInstek);
			print("Ihinst, A: " + IhInstek);

			// Relative error
			var IhErr = ((IhRead - IhInstek) / IhInstek * 100).toFixed(2);
			cal_IhErr.push(IhErr);
			print("Iherr,   %: " + IhErr);
			
			var IhSetErr = ((IhInstek - IhSet) / IhSet * 100).toFixed(2);
			cal_IhSetErr.push(IhSetErr);
			print("IhSeterr,%: " + IhSetErr);
			print("--------------------");

			if (anykey()) return 0;
		}
	}
	
	Zth_Im(cal_ImMin, false);

	return 1;
}
//--------------------

function CAL_InstekSetCurrentRange(Current)
{
	Instek_ConfVoltageDC(Current * cal_Rshunt / 1e6);
}
//--------------------

function CAL_InstekSetVoltageRange(Voltage)
{
	Instek_ConfVoltageDC(Voltage / 1000);
}
//--------------------

function CAL_ResetA()
{	
	// Results storage
	cal_Ud = [];
	cal_Im = [];
	cal_Ih = [];
	cal_ImSet = [];
	cal_IgSet = [];
	cal_IhSet = [];

	// Instek data
	cal_UdInst = [];
	cal_ImInst = [];
	cal_IgInst = [];
	cal_IhInst = [];

	// Relative error
	cal_UdErr = [];
	cal_ImErr = [];
	cal_IhErr = [];
	cal_ImSetErr = [];
	cal_IgSetErr = [];
	cal_IhSetErr = [];

	// Correction
	cal_UdCorr = [];
	cal_ImCorr = [];
	cal_IgCorr = [];
	cal_IhCorr = [];
}
//--------------------

function CAL_SaveUd(NameUd)
{
	CGEN_SaveArrays(NameUd, cal_Ud, cal_UdInst, cal_UdErr);
}
//--------------------

function CAL_SaveIm(NameIm)
{
	CGEN_SaveArrays(NameIm, cal_Im, cal_ImInst, cal_ImErr);
}
//--------------------

function CAL_SaveIg(NameIg)
{
	CGEN_SaveArrays(NameIg, cal_IgInst, cal_IgSet, cal_IgSetErr);
}
//--------------------

function CAL_SaveIh(NameIh)
{
	CGEN_SaveArrays(NameIh, cal_Ih, cal_IhInst, cal_IhErr);
}
//--------------------

function CAL_ResetUdCal()
{
	CAL_SetCoefUd(0, 1, 0);
}
//--------------------

function CAL_ResetImCal()
{
	CAL_SetCoefIm(0, 1, 0);
}
//--------------------

function CAL_ResetIgCal()
{
	CAL_SetCoefIg(0, 1, 0);
}
//--------------------

function CAL_ResetIhCal()
{
	CAL_SetCoefIh(0, 1, 0);
}
//--------------------

function CAL_SetCoefUd(P2, P1, P0)
{
	dev.ws(25, Math.round(P2 * 1e6));
	dev.w(26, Math.round(P1 * 1000));
	dev.ws(27, Math.round(P0 * 100));	
}
//--------------------

function CAL_SetCoefIm(P2, P1, P0)
{
	dev.ws(20, Math.round(P2 * 1e6));
	dev.w(21, Math.round(P1 * 1000));
	dev.ws(22, Math.round(P0 * 100));	
}
//--------------------

function CAL_SetCoefIg(P2, P1, P0)
{
	dev.ws(0, Math.round(P2 * 1e6));
	dev.w(1, Math.round(P1 * 1000));
	dev.ws(2, Math.round(P0 * 100));	
}
//--------------------

function CAL_SetCoefIh(P2, P1, P0)
{
	if(cal_IhRange)
	{
		dev.ws(15, Math.round(P2 * 1e6));
		dev.w(16, Math.round(P1 * 1000));
		dev.ws(17, Math.round(P0 * 100));
	}
	else
	{
		dev.ws(10, Math.round(P2 * 1e6));
		dev.w(11, Math.round(P1 * 1000));
		dev.ws(12, Math.round(P0 * 100));
	}
}
//--------------------

function CAL_PrintCoefUd()
{
	print("Ud P2 x1e6	: " + dev.rs(25));
	print("Ud P1 x1000	: " + dev.r(26));
	print("Ud P0 x100	: " + dev.rs(27));
}
//--------------------

function CAL_PrintCoefIm()
{
	print("Im P2 x1e6	: " + dev.rs(20));
	print("Im P1 x1000	: " + dev.rs(21));
	print("Im P0 x100	: " + dev.rs(22));
}
//--------------------

function CAL_PrintCoefIg()
{
	print("Im P2 x1e6	: " + dev.rs(0));
	print("Im P1 x1000	: " + dev.rs(1));
	print("Im P0 x100	: " + dev.rs(2));
}
//--------------------

function CAL_PrintCoefIh()
{
	if(cal_IhRange)
	{
		print("Ih P2 x1e6	: " + dev.rs(15));
		print("Ih P1 x1000	: " + dev.rs(16));
		print("Ih P0 x100	: " + dev.rs(17));
	}
	else
	{
		print("Ih P2 x1e6	: " + dev.rs(10));
		print("Ih P1 x1000	: " + dev.rs(11));
		print("Ih P0 x100	: " + dev.rs(12));
	}
}
//--------------------

