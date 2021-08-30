include("Tektronix.js")


function Instek_PortInit(PortNumber, BaudeRate)
{
	TEK_PortInit(PortNumber, BaudeRate);
}

function Instek_Send(Request)
{
	TEK_Send(Request);
}

function Instek_Exec(Request)
{
	return TEK_Exec(Request);
}



function Instek_ConfAuto(Enable)
{
	if (Enable == 0)
	{
		Instek_Send("CONF:AUTO OFF");
	}
	else if (Enable == 1)
	{
		Instek_Send("CONF:AUTO ON");
	}
	else
	{
		print("Invalid state for AUTO");
	}
}

function Instek_ConfDetectorRate(Rate)
{
	Instek_Send("SENS:DET:RATE " + Rate);
}

function Instek_ConfVoltageDC(Range)
{
	Instek_Send("CONF:VOLT:DC " + Range.toExponential(1));
}

function Instek_ConfCurrentDC(Range)
{
	Instek_Send("CONF:CURR:DC " + Range.toExponential(1));
}

function Instek_ConfResistance(Range)
{
	Instek_Send("CONF:RES " + Range.toExponential(1));
}

function Instek_ConfContinuity()
{
	Instek_Send("CONF:CONT");
}



function Instek_MeasureVolDC()
{
	return parseFloat(Instek_Exec("MEAS:VOLT:DC?")).toFixed(5);
}

function Instek_MeasureCurDC()
{
	return parseFloat(Instek_Exec("MEAS:CURR:DC?")).toFixed(5);
}

function Instek_MeasureRes()
{
	return parseFloat(Instek_Exec("MEAS:RES?")).toFixed(5);
}

function Instek_MeasureCont()
{
	return parseFloat(Instek_Exec("MEAS:CONT?")).toFixed(5);
}



function Instek_CalFunction(FunctionNumber)
{
	switch (FunctionNumber)
	{
		case 0:
			Instek_Send("CALC:FUNC OFF");
			break;
			
		case 1:
			Instek_Send("CALC:FUNC MIN");
			break;
			
		case 2:
			Instek_Send("CALC:FUNC MAX");
			break;
			
		case 3:
			Instek_Send("CALC:FUNC HOLD");
			break;
			
		case 4:
			Instek_Send("CALC:FUNC HOLD");
			break;
			
		case 5:
			Instek_Send("CALC:FUNC REL");
			break;
			
		case 6:
			Instek_Send("CALC:FUNC COMP");
			break;
		
		case 7:
			Instek_Send("CALC:FUNC DB");
			break;
			
		case 8:
			Instek_Send("CALC:FUNC DBM");
			break;
			
		case 9:
			Instek_Send("CALC:FUNC MXB");
			break;
			
		case 10:
			Instek_Send("CALC:FUNC INV");
			break;
			
		case 11:
			Instek_Send("CALC:FUNC REF");
			break;
	}
}

function Instek_CalState(Enable)
{
	if (Enable == 0)
	{
		Instek_Send("CALC:STAT OFF");
	}
	else if (Enable == 1)
	{
		Instek_Send("CALC:STAT ON");
	}
	else
	{
		print("Invalid state for CAL");
	}	
}

function Instek_CalMin()
{
	return Instek_Exec("CALC:MIN?")
}

function Instek_CalMax()
{
	return Instek_Exec("CALC:MAX?")
}

function Instek_CalHoldReferebce(Ref)
{
	nstek_Send(": CALC:HOLD:REF " + Ref);
}



function Instek_RequestAuto()
{
	return Instek_Exec("CONF:AUTO?")
}

function Instek_RequestFunction()
{
	return Instek_Exec("CONF:FUNC?")
}

function Instek_RequestRange()
{
	return Instek_Exec("CONF:RANG?")
}

function Instek_RequestDetectorRate()
{
	return Instek_Exec("DET:RATE?")
}

function Instek_RequestCalFunction()
{
	return Instek_Exec("CALC:FUNC?")
}

function Instek_RequestCalState()
{
	return Instek_Exec("CALC:STAT?")
}


