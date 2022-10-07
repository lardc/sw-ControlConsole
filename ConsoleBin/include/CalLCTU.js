include("TestLCTU.js")
include("CalGeneral.js")

// Calibration setup parameters
cal_Points = 10;

cal_Ice_Rshunt = 100;	// in Ohm
cal_Ice_Rload = 110		// in kOhm

cal_IceMin = 2;			// in mA	
cal_IceMax = 30;		// in mA
cal_IceStp = (cal_IceMax - cal_IceMin) / cal_Points;

cal_UceProbe = 500;
cal_UceRange = 1;
cal_UceMin = [200, 1301];	
cal_UceMax = [1300, 3300];
cal_UceStp = (cal_UceMax[cal_UceRange] - cal_UceMin[cal_UceRange]) / cal_Points;

cal_Iterations = 1;
//		

// Counters
cal_CntTotal = 0;
cal_CntDone = 0;

// Results storage
cal_Ice = [];
cal_Uce = [];
cal_UceSet = [];

// Keithley data
cal_UceKei = [];
cal_IceKei = [];

// Relative error
cal_IceErr = [];
cal_UceErr = [];
cal_UceSetErr = [];

// Correction
cal_IceCorr = [];
cal_UceCorr = [];



function CAL_Init(portDevice)
{
	// Init device port
	dev.Disconnect();
	dev.Connect(portDevice);
}
//--------------------

function CAL_CalibrateUce()
{		
	CAL_ResetA();
	CAL_ResetUceCal();

	// Reload values
	var VoltageArray = CGEN_GetRange(cal_UceMin[cal_UceRange], cal_UceMax[cal_UceRange], cal_UceStp);

	if (CAL_CollectUce(VoltageArray, cal_Iterations))
	{
		CAL_SaveUce("LCTU_Uce");

		// Plot relative error distribution
		scattern(cal_UceKei, cal_UceErr, "Voltage (in V)", "Error (in %)", "Voltage relative error");
		
		// Plot relative error distribution
		scattern(cal_UceKei, cal_UceSetErr, "Voltage (in V)", "Error (in %)", "Set voltage relative error");

		// Calculate correction
		cal_UceCorr = CGEN_GetCorrection2("LCTU_Uce");
		CAL_SetCoefUce(cal_UceCorr[0], cal_UceCorr[1], cal_UceCorr[2]);
		CAL_PrintCoefUce();
	}
}
//--------------------

function CAL_CalibrateIce()
{		
	CAL_ResetA();
	CAL_ResetIceCal();

	// Reload values
	var CurrentArray = CGEN_GetRange(cal_IceMin, cal_IceMax, cal_IceStp);

	if (CAL_CollectIce(CurrentArray, cal_Iterations))
	{
		CAL_SaveIce("LCTU_Ice");

		// Plot relative error distribution
		scattern(cal_IceKei, cal_IceErr, "Current (in mA)", "Error (in %)", "Current relative error");

		// Calculate correction
		cal_IceCorr = CGEN_GetCorrection2("LCTU_Ice");
		CAL_SetCoefIce(cal_IceCorr[0], cal_IceCorr[1], cal_IceCorr[2]);
		CAL_PrintCoefIce();
	}
}
//--------------------

function CAL_VerifyUce()
{		
	CAL_ResetA();

	// Reload values
	var VoltageArray = CGEN_GetRange(cal_UceMin[cal_UceRange], cal_UceMax[cal_UceRange], cal_UceStp);

	if (CAL_CollectUce(VoltageArray, cal_Iterations))
	{
		CAL_SaveUce("LCTU_Uce_fixed");

		// Plot relative error distribution
		scattern(cal_UceKei, cal_UceErr, "Voltage (in V)", "Error (in %)", "Voltage relative error");
		
		// Plot relative error distribution
		scattern(cal_UceKei, cal_UceSetErr, "Voltage (in V)", "Error (in %)", "Set voltage relative error");
	}
}
//--------------------

function CAL_VerifyIce()
{		
	CAL_ResetA();

	// Reload values
	var CurrentArray = CGEN_GetRange(cal_IceMin, cal_IceMax, cal_IceStp);

	if (CAL_CollectIce(CurrentArray, cal_Iterations))
	{
		CAL_SaveIce("LCTU_Ice_fixed");

		// Plot relative error distribution
		scattern(cal_IceKei, cal_IceErr, "Current (in mA)", "Error (in %)", "Current relative error");
	}
}
//--------------------

function CAL_CollectUce(VoltageValues, IterationsCount)
{
	cal_CntTotal = IterationsCount * VoltageValues.length;
	cal_CntDone = 1;
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < VoltageValues.length; j++)
		{
			print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --");
			//
			
			PrintData = 0;
			LCTU_Start(VoltageValues[j], 100);
			PrintData = 1;

			p("");
			p("Enter the measured voltage value in Volts and press Enter:");
			
			// Keithley data
			var UceKeithley = readline() * cal_UceProbe;;
			cal_UceKei.push(UceKeithley);
			p("");
			print("UceKeithley, V: " + UceKeithley);

			// Unit data
			var UceRead = dev.rf(200).toFixed(2);
			cal_Uce.push(UceRead);
			print("UceRead,   V: " + UceRead);

			// Relative error
			var UceErr = ((UceRead - UceKeithley) / UceKeithley * 100).toFixed(2);
			cal_UceErr.push(UceErr);
			print("Uceerr,   %: " + UceErr);
			
			// Relative set error
			var UceSetErr = ((UceKeithley - VoltageValues[j]) / VoltageValues[j] * 100).toFixed(2);
			cal_UceSetErr.push(UceSetErr);
			print("UceSeterr,   %: " + UceSetErr);
			print("--------------------");
		}
	}

	return 1;
}
//--------------------

function CAL_CollectIce(CurrentValues, IterationsCount)
{
	cal_CntTotal = IterationsCount * CurrentValues.length;
	cal_CntDone = 1;
	
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < CurrentValues.length; j++)
		{

			print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --");
			//

			PrintData = 0;
			LCTU_Start(CurrentValues[j] * cal_Ice_Rload, 100);
			PrintData = 1;
			
			p("");
			p("Enter the measured current value in mA and press Enter:");

			// Keithley data
			var IceKeithley = readline();
			cal_IceKei.push(IceKeithley);
			p("");
			print("IceKeithley, mA: " + IceKeithley);

			// Unit data
			var IceRead = (dev.rf(201)).toFixed(3);
			cal_Ice.push(IceRead);
			print("IceRead,   mA: " + IceRead);

			// Relative error
			var IceErr = ((IceRead - IceKeithley) / IceKeithley * 100).toFixed(2);
			cal_IceErr.push(IceErr);
			print("Iceerr,   %: " + IceErr);
			print("--------------------");
		}
	}

	return 1;
}
//--------------------

function CAL_ResetA()
{	
	// Results storage
	cal_Uce = [];
	cal_Ice = [];
	cal_UceSet = [];

	// Keithley data
	cal_UceKei = [];
	cal_IceKei = [];

	// Relative error
	cal_UceErr = [];
	cal_IceErr = [];
	cal_UceSetErr = [];

	// Correction
	cal_UceCorr = [];
	cal_IceCorr = [];
}
//--------------------

function CAL_SaveUce(NameUce)
{
	CGEN_SaveArrays(NameUce, cal_Uce, cal_UceKei, cal_UceErr);
}
//--------------------

function CAL_SaveIce(NameIce)
{
	CGEN_SaveArrays(NameIce, cal_Ice, cal_IceKei, cal_IceErr);
}
//--------------------

function CAL_ResetUceCal()
{
	CAL_SetCoefUce(0, 1, 0);
}
//--------------------

function CAL_ResetIceCal()
{
	CAL_SetCoefIce(0, 1, 0);
}
//--------------------

function CAL_SetCoefUce(P2, P1, P0)
{
	if(cal_UceRange)
	{
		dev.wf(7, parseFloat(P2));
		dev.wf(8, parseFloat(P1));
		dev.wf(9, parseFloat(P0));	
	}
	else
	{
		dev.wf(2, parseFloat(P2));
		dev.wf(3, parseFloat(P1));
		dev.wf(4, parseFloat(P0));	
	}
}
//--------------------

function CAL_SetCoefIce(P2, P1, P0)
{
	dev.wf(12, parseFloat(P2));
	dev.wf(13, parseFloat(P1));
	dev.wf(14, parseFloat(P0));	
}
//--------------------

function CAL_PrintCoefUce()
{
	if(cal_UceRange)
	{
		print("Uce P2 : " + dev.rf(7));
		print("Uce P1 : " + dev.rf(8));
		print("Uce P0 : " + dev.rf(9));
	}
	else
	{
		print("Uce P2 : " + dev.rf(2));
		print("Uce P1 : " + dev.rf(3));
		print("Uce P0 : " + dev.rf(4));
	}
}
//--------------------

function CAL_PrintCoefIce()
{
	print("Ice P2 : " + dev.rf(12));
	print("Ice P1 : " + dev.rf(13));
	print("Ice P0 : " + dev.rf(14));
}
//--------------------