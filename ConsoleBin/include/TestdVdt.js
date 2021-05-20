include("PrintStatus.js")
include("CalGeneral.js")

// Voltage settings for unit test
dvdt_Vmin = 500;
dvdt_Vmax = 4500;
dvdt_Vstp = 500;

function _dVdt_Active()
{
	if (dev.r(192) == 4)
		return 1;
	else
		return 0;
}

function dVdt_Start()
{
	for (var i = 101; i <= 105; i++)
	{
		dev.c(i);
		while (_dVdt_Active()) { sleep(20); };
	}
}

function dVdt_WarmUp(UsePulse)
{
	var counter = 0;
	
	while(!anykey())
	{
		dev.w(128, 1000);
		dev.c(10);
		if (UsePulse) dVdt_Start();
		sleep(1000);
		dVdt_PrintInfo();
		sleep(10000);
		
		dev.w(128, 4000)
		dev.c(10);
		sleep(3000);
		if (UsePulse) dVdt_Start();
		sleep(1000);
		dVdt_PrintInfo();
		sleep(10000);
		
		print("--------");
		print(++counter);
		print("--------");
	}
}

function dVdt_StartRange()
{
	var VoltageArray = CGEN_GetRange(dvdt_Vmin, dvdt_Vmax, dvdt_Vstp);
	
	for (var i = 0; i < VoltageArray.length; i++)
	{
		dev.w(128, VoltageArray[i]);
		dVdt_Start();
		
		if (anykey()) return;
	}
}

function dVdt_PrintInfo()
{
	var i;
	
	for (i = 1; i < 7; i++)
		print("Vok#" + i + "\t" + dev.r(200 + i));
		
	for (i = 1; i < 7; i++)
		print("V  #" + i + "\t" + dev.r(206 + i));
		
	for (i = 1; i < 7; i++)
		print("St #" + i + "\t" + dev.r(212 + i));
		
	PrintStatus();
}

function dVdt_CellReadRegs(CellID)
{
	var i;
	
	dev.w(185, CellID);
	
	for (i = 1; i <= 4; i++)
	{
		dev.w(186, i);
		dev.c(120);
		print(i + " = " + dev.r(225));
	}
	print("----");
	for (i = 10; i <= 13; i++)
	{
		dev.w(186, i);
		dev.c(120);
		print(i + " = " + dev.r(225));
	}
	print("----");
	for (i = 14; i <= 15; i++)
	{
		dev.w(186, i);
		dev.c(120);
		print(i + " = " + dev.r(225));
	}
}

function dVdt_PrintGateV()
{
	for (var i = 0; i < 6; i++)
	{
		print("Cell " + (i + 1) + ": " + dev.r(230 + i));
	}
}

function dVdt_CellSetV(CellID, Voltage)
{
	dVdt_CellWriteReg(CellID, 1, Voltage);
	dVdt_CellCall(CellID, 10);
}

function dVdt_CellSetGate(CellID, Gate)
{
	dVdt_CellWriteReg(CellID, 2, Gate);
	dVdt_CellCall(CellID, 112);
}

// Basic functions

function dVdt_CellReadReg(CellID, Reg)
{
	dev.w(185, CellID);
	dev.w(186, Reg);
	dev.c(120);
	
	return dev.r(225);
}

function dVdt_CellWriteReg(CellID, Reg, Value)
{
	dev.w(185, CellID);
	dev.w(186, Reg);
	dev.w(187, Value);
	dev.c(121);
}

function dVdt_CellCall(CellID, Action)
{
	dev.w(185, CellID);
	dev.w(186, Action);
	dev.c(122);
}

function dVdt_CellPulse(CellID, Voltage, Gate, NoShutdown)
{
	dVdt_CellCall(CellID, 1);
	
	dVdt_CellSetV(CellID, Voltage);
	dVdt_CellSetGate(CellID, Gate);
	
	while (dVdt_CellReadReg(CellID, 14) != 1)
		sleep(100);
	
	sleep(500);
	dev.c(114);
	
	if ((typeof NoShutdown == 'undefined') || NoShutdown == 0)
		dVdt_CellCall(CellID, 2);
}
