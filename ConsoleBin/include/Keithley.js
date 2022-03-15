include("Tektronix.js")

function KEI_PortInit(PortNumber)
{
	TEK_PortInit(PortNumber, 9600);
}

function KEI_ZeroCorrect()
{
	TEK_Send("*RST");
	TEK_Send("SYST:ZCH ON");
	//
	TEK_Send("CURR:RANG 2E-9");
	TEK_Send("INIT");
	TEK_Send("SYST:ZCOR:ACQ");
	//
	TEK_Send("SYST:ZCH OFF");
	TEK_Send("SYST:ZCOR ON");
}

function KEI_Measure()
{
	return parseFloat(TEK_Exec("READ?"));
}

function KEI_Read()
{
	return parseFloat(TEK_Exec("SENSe:DATA?"));
}

function KEI_SetRange(Range)
{
	TEK_Send("CURR:RANG " + Range);
}

function KEI_MedianFilterControl(Rank, State)
{
	// Rank = 1..5
	
	if(Rank < 1 || Rank > 5)
		Rank = 1;
	
	if(State)
	{
		TEK_Send("MED:RANK " + Rank);
		TEK_Send("MED ON");
	}
	else
		TEK_Send("MED OFF");
}

function KEI_Average(Count, NoiseTol, State)
{
	// Count = 2..100 (Specify filter count)
	// NoiseTol = 0..105 (Specify noise tolerance (in %))
	
	if(Count < 1 || Count > 100)
		Count = 1;
	if(NoiseTol < 0 || NoiseTol > 105)
		NoiseTol = 0;
	
	if(State)
	{
		TEK_Send("AVER:COUN " + Count);
		TEK_Send("AVER:TCON MOV");
		TEK_Send("AVER:ADV:NTOL " + NoiseTol);
		TEK_Send("AVER:ADV ON");
		TEK_Send("AVER ON");
	}
	else
	{
		TEK_Send("AVER:ADV OFF");
		TEK_Send("AVER OFF");
	}
}

function KEI_SetCorrection(M, B)
{
	TEK_Send("CALC:FORM MXB");
	TEK_Send("CALC:KMAT:MMF " + M);
	TEK_Send("CALC:KMAT:MBF " + B);
	TEK_Send("CALC:STAT ON");
	TEK_Send("INIT");
}

function KEI_MeasureCorrectedValue()
{
	return parseFloat(TEK_Exec("CALC:DATA?"));
}

function KEI_SetTLinkInputLine(Line)
{
	TEK_Send("ARM:ASYNchronous:ILINe " + Line);
}

function KEI_SetTLinkOutputLine(Line)
{
	TEK_Send("ARM:ASYNchronous:OLINe " + Line);
}

function KEI_SetExtTrigger(ArmCounter, TriggerCounter)
{
	TEK_Send("ARM:SOURce TLINk");
	TEK_Send("ARM:COUNt " + ArmCounter);
	TEK_Send("TRIGger:SOURce TLINk");
	TEK_Send("TRIGger:COUNt " + TriggerCounter);
}

function KEI_InitTrigWaiting()
{
	TEK_Send("INITiate");
}
