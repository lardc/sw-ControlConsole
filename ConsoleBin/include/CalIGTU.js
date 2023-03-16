include("DMM6500.js")
include("CalGeneral.js")

//---------Unchangeable parameters----------
//
cal_PulsePlate 			= 3800 		// in us
cal_TriggerDelay 		= 6e-3		// in s
//
cal_Ilow = [0.1, 2, 20]				// in mA
cal_Ihigh = [1, 20, 200]			// in mA
//
cal_Rint = [8600, 34, 34]
//
cal_Vlow = 2;						// in V
cal_Vhigh = 30;						// in V
//
cal_V_ImeasLow			= 0
cal_V_ImeasHigh_R0		= 1
cal_V_ImeasHigh_R1		= 2
cal_V_Vmeas				= 3
cal_V_Vset				= 4
//------------------------------------------

// Calibration setup parameters
cal_Points = 10;
//
cal_Rload = 100
//
cal_Vmin = 2;	
cal_Vmax = 10;
//
cal_CalibrationType = cal_V_ImeasHigh_R1;
//
cal_Iterations 	= 5;
//

// Counters
cal_CntTotal = 0;
cal_CntDone = 0;
//

// Variables
Setpoint = [];

// Results storage
cal_I = [];
cal_V = [];
cal_Vset = [];

// Keithley data
cal_KEIData = [];
cal_Ikei = [];

// Relative error
cal_Err = [];

// Correction
cal_Corr = [];


function CAL_Calibrate_V()
{	
	var SetpointArray
	
	// Reload values
	switch(cal_CalibrationType)
	{
		case cal_V_ImeasLow:
		case cal_V_ImeasHigh_R0:
		case cal_V_ImeasHigh_R1:
			cal_Vmin = cal_Ilow[cal_CalibrationType] / 1000 * cal_Rload + cal_Rint[cal_CalibrationType] * cal_Ilow[cal_CalibrationType] / 1000
			cal_Vmax = cal_Ihigh[cal_CalibrationType] / 1000 * cal_Rload + cal_Rint[cal_CalibrationType] * cal_Ihigh[cal_CalibrationType] / 1000
			
		default:
			if(cal_Vmin >= cal_Vlow && cal_Vmax <= cal_Vhigh)
			{
				cal_Vstp = (cal_Vmax - cal_Vmin) / cal_Points;
				SetpointArray = CGEN_GetRange(cal_Vmin, cal_Vmax, cal_Vstp)
			}
			else
			{
				p("Wrong calibration parameters!")
				return
			}
			break
	}
	
	CAL_ConfigDMM6500()
	CAL_IGTUSetCurrentRange()

	CAL_ResetArrays()
	CAL_ResetCalibration()
	
	if (CAL_CollectV(SetpointArray, cal_Iterations))
	{
		CAL_Save()
		CAL_PlotGraph()
		CAL_CalculateCorrection()
	}
}
//--------------------

function CAL_Verify_V()
{	
	var SetpointArray
	
	// Reload values
	switch(cal_CalibrationType)
	{
		case cal_V_ImeasLow:
		case cal_V_ImeasHigh_R0:
		case cal_V_ImeasHigh_R1:
			cal_Vmin = cal_Ilow[cal_CalibrationType] / 1000 * cal_Rload + cal_Rint[cal_CalibrationType] * cal_Ilow[cal_CalibrationType] / 1000
			cal_Vmax = cal_Ihigh[cal_CalibrationType] / 1000 * cal_Rload + cal_Rint[cal_CalibrationType] * cal_Ihigh[cal_CalibrationType] / 1000
			
		default:
			if(cal_Vmin >= cal_Vlow && cal_Vmax <= cal_Vhigh)
			{
				cal_Vstp = (cal_Vmax - cal_Vmin) / cal_Points;
				SetpointArray = CGEN_GetRange(cal_Vmin, cal_Vmax, cal_Vstp)
			}
			else
			{
				p("Wrong calibration parameters!")
				return
			}
			break
	}
	
	CAL_ConfigDMM6500()
	CAL_IGTUSetCurrentRange()

	CAL_ResetArrays()

	if (CAL_CollectV(SetpointArray, cal_Iterations))
	{
		CAL_Save()
		CAL_PlotGraph()
	}
}
//--------------------

function CAL_CollectV(VoltageValues, IterationsCount)
{
	cal_CntTotal = IterationsCount * VoltageValues.length;
	cal_CntDone = 1;
	
	for (var i = 0; i < IterationsCount; i++)
	{
		for (var j = 0; j < VoltageValues.length; j++)
		{
			print("-- result " + cal_CntDone++ + " of " + cal_CntTotal + " --")
			//
			
			switch(cal_CalibrationType)
			{
				case cal_V_Vmeas:
				case cal_V_Vset:
					KEI_SetVoltageRange(VoltageValues[j] * 1.2)
					break
					
				case cal_V_ImeasLow:			
				case cal_V_ImeasHigh_R0:			
				case cal_V_ImeasHigh_R1:
					KEI_SetCurrentRange(VoltageValues[j] / cal_Rload * 1.2)
					break;
			}
	
			KEI_ActivateTrigger()
			sleep(500)
			
			dev.wf(140, VoltageValues[j])
			dev.c(70)
			sleep(500)
			
			// Setpoint
			Setpoint.push(VoltageValues[j])
			print("Vset,    V: " + VoltageValues[j])
			
			switch(cal_CalibrationType)
			{
				case cal_V_Vmeas:
					var KEIData = KEI_ReadAverage()
					cal_KEIData.push(KEIData)
					print("KEI,    V: " + KEIData)
					
					var Uread = dev.rf(210)
					cal_V.push(Uread)
					print("Uread,   V: " + Uread)

					// Relative error
					var Uerr = ((Uread - KEIData) / KEIData * 100).toFixed(2)
					cal_Err.push(Uerr)
					print("Uerr,    %: " + Uerr)
					break
					
				case cal_V_Vset:
					var KEIData = KEI_ReadAverage()
					cal_KEIData.push(KEIData)
					print("KEI,    V: " + KEIData)
				
					// Relative set error
					var VsetErr = ((KEIData - VoltageValues[j]) / VoltageValues[j] * 100).toFixed(2)
					cal_Err.push(VsetErr)
					print("Vseterr, %: " + VsetErr)
					break
					
				case cal_V_ImeasLow:
				case cal_V_ImeasHigh_R0:					
				case cal_V_ImeasHigh_R1:
					var KEIData = KEI_ReadAverage() * 1000;
					cal_KEIData.push(KEIData)
					print("KEI,    mA: " + KEIData)
					
					var Iread = dev.rf(211)
					cal_I.push(Iread)
					print("Iread,   mA: " + Iread)

					// Relative error
					var Ierr = ((Iread - KEIData) / KEIData * 100).toFixed(2)
					cal_Err.push(Ierr)
					print("Ierr,    %: " + Ierr)
					break;
			}			

			print("--------------------")
			
			if(anykey())
				return 0;
		}
	}

	return 1;
}
//--------------------

function CAL_PlotGraph()
{	
	switch(cal_CalibrationType)
	{
		case cal_V_Vmeas:
			scattern(cal_KEIData, cal_Err, "Voltage (in V)", "Error (in %)", "Voltage relative error")
			break
			
		case cal_V_Vset:
			scattern(Setpoint, cal_Err, "Voltage (in V)", "Error (in %)", "Set voltage relative error")
			break
			
		case cal_V_ImeasLow:			
		case cal_V_ImeasHigh_R0:			
		case cal_V_ImeasHigh_R1:
			scattern(cal_KEIData, cal_Err, "Current (in mA)", "Error (in %)", "Current relative error")
			break;
	}
}
//--------------------

function CAL_CalculateCorrection()
{	
	Reg = []
	
	switch(cal_CalibrationType)
	{
		case cal_V_Vmeas:
			Reg = [0,1,2]		// [P2, P1, P0]
			cal_Corr = CGEN_GetCorrection2("IGTU_V")
			break
			
		case cal_V_Vset:
			Reg = [15,16,17]	// [P2, P1, P0]
			cal_Corr = CGEN_GetCorrection2("IGTU_Vset")
			break
			
		case cal_V_ImeasLow:
			Reg = [70,71,72]		// [P2, P1, P0]
			cal_Corr = CGEN_GetCorrection2("IGTU_I")
			break
			
		case cal_V_ImeasHigh_R0:
			Reg = [5,6,7]		// [P2, P1, P0]
			cal_Corr = CGEN_GetCorrection2("IGTU_I")
			break
			
		case cal_V_ImeasHigh_R1:
			Reg = [10,11,12]		// [P2, P1, P0]
			cal_Corr = CGEN_GetCorrection2("IGTU_I")
			break
	}
	
	CAL_SetCoef(Reg, cal_Corr)
	CAL_PrintCoef(Reg)
}
//--------------------

function CAL_ResetCalibration(Verification)
{	
	Reg = []
	Data = [0,1,0]
	
	switch(cal_CalibrationType)
	{
		case cal_V_Vmeas:
			Reg = [0,1,2]		// [P2, P1, P0]
			break
			
		case cal_V_Vset:
			Reg = [15,16,17]	// [P2, P1, P0]
			break
			
		case cal_V_ImeasLow:
			Reg = [70,71,72]	// [P2, P1, P0]
			break
			
		case cal_V_ImeasHigh_R0:
			Reg = [5,6,7]	// [P2, P1, P0]
			break
			
		case cal_V_ImeasHigh_R1:
			Reg = [10,11,12]	// [P2, P1, P0]
			break
	}
	
	CAL_SetCoef(Reg, Data)
}
//--------------------

function CAL_SetCoef(Reg, Data)
{
	dev.wf(Reg[0], Data[0])
	dev.wf(Reg[1], Data[1])
	dev.wf(Reg[2], Data[2])
}
//--------------------

function CAL_PrintCoef(Reg)
{
	print("P2 : " + dev.rf(Reg[0]))
	print("P1 : " + dev.rf(Reg[1]))
	print("P0 : " + dev.rf(Reg[2]))
}
//--------------------

function CAL_Save()
{		
	switch(cal_CalibrationType)
	{
		case cal_V_Vmeas:
			CGEN_SaveArrays("IGTU_V", cal_V, cal_KEIData, cal_Err)
			break
			
		case cal_V_Vset:
			CGEN_SaveArrays("IGTU_Vset", cal_KEIData, Setpoint, cal_Err)
			break
			
		case cal_V_ImeasLow:
		case cal_V_ImeasHigh_R0:
		case cal_V_ImeasHigh_R1:
			CGEN_SaveArrays("IGTU_I", cal_I, cal_KEIData, cal_Err)
			break
	}
}
//--------------------

function CAL_IGTUSetCurrentRange()
{
	var CurrentMax = cal_Vmax / (cal_Rload + cal_Rint[cal_CalibrationType]) * 1000
	
	dev.w(50,State)		// Parametric mode of regulator is disabled
	dev.wf(141, CurrentMax)
}
//--------------------

function CAL_ConfigDMM6500()
{
	KEI_Reset()
	
	switch(cal_CalibrationType)
	{
		case cal_V_Vmeas:
		case cal_V_Vset:
			KEI_ConfigVoltage(cal_PulsePlate)
			break
			
		case cal_V_ImeasLow:
		case cal_V_ImeasHigh_R0:
		case cal_V_ImeasHigh_R1:
			KEI_ConfigCurrent(cal_PulsePlate)
			break;
	}
	
	KEI_ConfigExtTrigger(cal_TriggerDelay)
}
//--------------------

function CAL_ResetArrays()
{	
	// Results storage
	cal_V = [];
	cal_I = [];
	cal_Vset = [];

	// Keithley data
	cal_KEIData = [];
	cal_Ikei = [];

	// Relative error
	cal_Err = [];
	cal_Err = [];
	cal_Err = [];

	// Correction
	cal_Corr = [];
	cal_Icorr = [];
}
//--------------------