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

cal_Tmin  = 30;
cal_Tmax  = 200;
cal_TmaxStp = (cal_Tmax - cal_Tmin) / cal_Points;

cal_Calibrate_Tcase1 = 1;
cal_Calibrate_Tcool1 = 1;
cal_Calibrate_Tcase2 = 1;
cal_Calibrate_Tcool2 = 1;

cal_Iterations = 1;
//		

// Counters
cal_CntTotal = 0;
cal_CntDone = 0;

// Results storage
cal_Ud = [];
cal_Im = [];
cal_Ih = [];
cal_Tcase1 = [];
cal_Tcool1 = [];
cal_Tcase2 = [];
cal_Tcool2 = [];
cal_ImSet = [];
cal_IhSet = [];
cal_IgSet = [];

// Instek data
cal_UdInst = [];
cal_ImInst = [];
cal_IgInst = [];
cal_IhInst = [];
cal_TFluke = [];

// Relative error
cal_UdErr = [];
cal_ImErr = [];
cal_IhErr = [];
cal_Tcase1Err = [];
cal_Tcool1Err = [];
cal_Tcase2Err = [];
cal_Tcool2Err = [];
cal_ImSetErr = [];
cal_IhSetErr = [];
cal_IgSetErr = [];

// Correction
cal_UdCorr = [];
cal_ImCorr = [];
cal_IgCorr = [];
cal_IhCorr = [];
cal_Tcase1Corr = [];
cal_Tcool1Corr = [];
cal_Tcase2Corr = [];
cal_Tcool2Corr = [];

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

function CAL_CalibrateT()
{		
	CAL_ResetA();
	CAL_ResetTCal();

	// Reload values
	var TemperatureArray = CGEN_GetRange(cal_TMin, cal_TMax, cal_TStp);

	if (CAL_CollectT(TemperatureArray, cal_Iterations))
	{
		if(cal_Calibrate_Tcase1)
		{
			CAL_SaveTcase1("Zth_Tcase1");
			scattern(cal_TFluke, cal_Tcase1Err, "Device case temperature 1 (in C)", "Error (in %)", "Temperature relative error");
			
			// Calculate correction
			cal_Tcase1Corr = CGEN_GetCorrection2("Zth_Tcase1");
			CAL_SetCoefTcase1(cal_Tcase1Corr[0], cal_Tcase1Corr[1], cal_Tcase1Corr[2]);
			CAL_PrintCoefT();
		}
		
		if(cal_Calibrate_Tcool1)
		{
			CAL_SaveTcool1("Zth_Tcool1");
			scattern(cal_TFluke, cal_Tcool1Err, "Cooler temperature 1 (in C)", "Error (in %)", "Temperature relative error");
			
			// Calculate correction
			cal_Tcool1Corr = CGEN_GetCorrection2("Zth_Tcool1");
			CAL_SetCoefTcool1(cal_Tcool1Corr[0], cal_Tcool1Corr[1], cal_Tcool1Corr[2]);
			CAL_PrintCoefT();
		}
		
		if(cal_Calibrate_Tcase2)
		{
			CAL_SaveTcase2("Zth_Tcase2");
			scattern(cal_TFluke, cal_Tcase2Err, "Device case temperature 2 (in C)", "Error (in %)", "Temperature relative error");
			
			// Calculate correction
			cal_Tcase2Corr = CGEN_GetCorrection2("Zth_Tcase2");
			CAL_SetCoefTcase2(cal_Tcase2Corr[0], cal_Tcase2Corr[1], cal_Tcase2Corr[2]);
			CAL_PrintCoefT();
		}
		
		if(cal_Calibrate_Tcool2)
		{
			CAL_SaveTcool2("Zth_Tcool2");
			scattern(cal_TFluke, cal_Tcool2Err, "Cooler temperature 2 (in C)", "Error (in %)", "Temperature relative error");
			
			// Calculate correction
			cal_Tcool2Corr = CGEN_GetCorrection2("Zth_Tcool2");
			CAL_SetCoefTcool2(cal_Tcool2Corr[0], cal_Tcool2Corr[1], cal_Tcool2Corr[2]);
			CAL_PrintCoefT();
		}
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

function CAL_VerifyT()
{		
	CAL_ResetA();

	// Reload values
	var TemperatureArray = CGEN_GetRange(cal_TMin, cal_TMax, cal_TStp);

	if (CAL_CollectT(TemperatureArray, cal_Iterations))
	{
		if(cal_Calibrate_Tcase1)
		{

			CAL_SaveTcase1("Zth_Tcase1_fixed");
			scattern(cal_TFluke, cal_Tcase1Err, "Device case temperature 1 (in C)", "Error (in %)", "Temperature relative error");
		}
		
		if(cal_Calibrate_Tcool1)
		{
			CAL_SaveTcool1("Zth_Tcool1_fixed");
			scattern(cal_TFluke, cal_Tcool1Err, "Cooler temperature 1 (in C)", "Error (in %)", "Temperature relative error");
		}
		
		if(cal_Calibrate_Tcase2)
		{
			CAL_SaveTcase2("Zth_Tcase2_fixed");
			scattern(cal_TFluke, cal_Tcase2Err, "Device case temperature 2 (in C)", "Error (in %)", "Temperature relative error");
		}
		
		if(cal_Calibrate_Tcool2)
		{
			CAL_SaveTcool2("Zth_Tcool2_fixed");
			scattern(cal_TFluke, cal_Tcool2Err, "Cooler temperature 2 (in C)", "Error (in %)", "Temperature relative error");
		}
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

function CAL_CollectT(TemperatureValues, IterationsCount)
{
	var key, CurrentTemperature;
	
	cal_CntTotal = IterationsCount * TemperatureValues.length;
	cal_CntDone = 1;
	
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < TemperatureValues.length; j++)
		{
			print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --");
			//

			p("Press y, if the temperature reached " + TemperatureValues[j] + " C, or n, if current temperature is already lower,");
			p("or s to interrupt the process.");
			
			while(key != "y" && key != "n" && key != "s")
			{
				key = readline();
			}
			
			if(key == "s")
				return 0;
			
			if(key == "Y")
				CurrentTemperature = TemperatureValues[j];
			else
			{
				p("Enter current temperature in C");
				CurrentTemperature = readline();
			}
			
			if(cal_Calibrate_Tcase1)
			{
				var TempTcase1 = Zth_Tcase1();
				var Tcase1Err = TempTcase1 - CurrentTemperature;
				cal_Tcase1.push(TempTcase1);
				
				print("Tcase1,       C: " + TempTcase1);
				print("Tcase1 Error, C: " + Tcase1Err);
			}
			
			if(cal_Calibrate_Tcool1)
			{
				var TempTcool1 = Zth_Tcool1();
				var Tcool1Err = TempTcool1 - CurrentTemperature;
				cal_Tcool1.push(TempTcool1);
				
				print("Tcool1,       C: " + TempTcool1);
				print("Tcool1 Error, C: " + Tcool1Err);
			}
			
			if(cal_Calibrate_Tcase2)
			{
				var TempTcase2 = Zth_Tcase2();
				var Tcase2Err = TempTcase2 - CurrentTemperature;
				cal_Tcase2.push(TempTcase2);
				
				print("Tcase2,       C: " + TempTcase2);
				print("Tcase2 Error, C: " + Tcase2Err);
			}
			
			if(cal_Calibrate_Tcool2)
			{
				var TempTcool2 = Zth_Tcool2();
				var Tcool2Err = TempTcool2 - CurrentTemperature;
				cal_Tcool2.push(TempTcool2);
				
				print("Tcool2,  C: " + TempTcool2);
				print("Tcool2 Error, C: " + Tcool2Err);
			}
		}
	}

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
	cal_Tcase1 = [];
	cal_Tcool1 = [];
	cal_Tcase2 = [];
	cal_Tcool2 = [];
	cal_ImSet = [];
	cal_IgSet = [];
	cal_IhSet = [];

	// Instek data
	cal_UdInst = [];
	cal_ImInst = [];
	cal_IgInst = [];
	cal_IhInst = [];
	cal_TFluke = [];

	// Relative error
	cal_UdErr = [];
	cal_ImErr = [];
	cal_IhErr = [];
	cal_Tcase1Err = [];
	cal_Tcool1Err = [];
	cal_Tcase2Err = [];
	cal_Tcool2Err = [];
	cal_ImSetErr = [];
	cal_IgSetErr = [];
	cal_IhSetErr = [];

	// Correction
	cal_UdCorr = [];
	cal_ImCorr = [];
	cal_IgCorr = [];
	cal_IhCorr = [];
	cal_Tcase1Corr = [];
	cal_Tcool1Corr = [];
	cal_Tcase2Corr = [];
	cal_Tcool2Corr = [];
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

function CAL_SaveTcase1(NameT)
{
	CGEN_SaveArrays(NameT, cal_Tcase1, cal_TFluke, cal_Tcase1Err);
}
//--------------------

function CAL_SaveTcool1(NameT)
{
	CGEN_SaveArrays(NameT, cal_Tcool1, cal_TFluke, cal_Tcool1Err);
}
//--------------------

function CAL_SaveTcase2(NameT)
{
	CGEN_SaveArrays(NameT, cal_Tcase2, cal_TFluke, cal_Tcase2Err);
}
//--------------------

function CAL_SaveTcool2(NameT)
{
	CGEN_SaveArrays(NameT, cal_Tcool2, cal_TFluke, cal_Tcool2Err);
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

function CAL_ResetTCal()
{
	if(cal_Calibrate_Tcase1)
		CAL_SetCoefTcase1(0, 1, 0);
	
	if(cal_Calibrate_Tcool1)
		CAL_SetCoefTcool1(0, 1, 0);
	
	if(cal_Calibrate_Tcase2)
		CAL_SetCoefTcase2(0, 1, 0);
	
	if(cal_Calibrate_Tcool2)
		CAL_SetCoefTcool2(0, 1, 0);
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

function CAL_SetCoefTcase1(P2, P1, P0)
{
	dev.ws(32, Math.round(P2 * 1e6));
	dev.w(33, Math.round(P1 * 1000));
	dev.ws(34, Math.round(P0 * 100));	
}
//--------------------

function CAL_SetCoefTcool1(P2, P1, P0)
{
	dev.ws(38, Math.round(P2 * 1e6));
	dev.w(39, Math.round(P1 * 1000));
	dev.ws(40, Math.round(P0 * 100));	
}
//--------------------

function CAL_SetCoefTcase2(P2, P1, P0)
{
	dev.ws(35, Math.round(P2 * 1e6));
	dev.w(36, Math.round(P1 * 1000));
	dev.ws(37, Math.round(P0 * 100));	
}
//--------------------

function CAL_SetCoefTcool2(P2, P1, P0)
{
	dev.ws(41, Math.round(P2 * 1e6));
	dev.w(42, Math.round(P1 * 1000));
	dev.ws(43, Math.round(P0 * 100));	
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

function CAL_PrintCoefT()
{
	if(cal_Calibrate_Tcase1)
	{
		print("Tcase1 P2 x1e6	: " + dev.rs(32));
		print("Tcase1 P1 x1000	: " + dev.rs(33));
		print("Tcase1 P0 x100	: " + dev.rs(34));
	}
	
	if(cal_Calibrate_Tcool1)
	{
		print("Tcool1 P2 x1e6	: " + dev.rs(38));
		print("Tcool1 P1 x1000	: " + dev.rs(39));
		print("Tcool1 P0 x100	: " + dev.rs(40));
	}
	
	if(cal_Calibrate_Tcase2)
	{
		print("Tcase2 P2 x1e6	: " + dev.rs(35));
		print("Tcase2 P1 x1000	: " + dev.rs(36));
		print("Tcase2 P0 x100	: " + dev.rs(37));
	}
	
	if(cal_Calibrate_Tcool2)
	{
		print("Tcool2 P2 x1e6	: " + dev.rs(41));
		print("Tcool2 P1 x1000	: " + dev.rs(42));
		print("Tcool2 P0 x100	: " + dev.rs(43));
	}
}
//--------------------

