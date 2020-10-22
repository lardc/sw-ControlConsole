include("PrintStatus.js")

//-----------------------------------------------------------
function ECAC_Pulse(Voltage, Current , Line)
{
	if(dev.r(192) == 3)
	{
		//Запись значения ударного тока
		dev.w(128, Voltage);
		w32(129, Current);
		dev.w(131, Line);
	
		//Формирование импульса
		dev.c(100);
		
		while(dev.r(192) == 5){sleep(10);}
		
		if(dev.r(192) == 1)
		PrintStatus();
	}
	else
	{
		if(dev.r(192) != 1)
			print("Device not ready");
		else
			PrintStatus();
	}
		
}
//-----------------------------------------------------------

function ECAC_ConnectCTRL()
{
	dev.w(190, 0);
	dev.c(53);
	
	dev.w(190, 1);
	dev.c(52);
}
//-----------------------------------------------------------

function ECAC_ConnectPOW()
{
	dev.w(190, 0);
	dev.c(52);
	
	dev.w(190, 1);
	dev.c(53);
}

//-----------------------------------------------------------

function ECAC_Info()
{
p("DEV_STATE " + dev.r(192));		// Регистр состояния
p("FAULT_REASON " + dev.r(193));	// Регистр Fault
p("DISABLE_REASON " + dev.r(194));	// Регистр Disable
p("WARNING " + dev.r(195));			// Регистр Warning
p("PROBLEM " + dev.r(196));			// Регистр Problem
p("OP_RESULT " + dev.r(197));		// Регистр результата операции
p("SUB_STATE " + dev.r(198));		// Регистр вспомогательного состояния
}
//------------------------------------------------------------


//-----------------------------------------------------------
function ECAC_Plot()
{
	plot2(dev.rafs(1), dev.rafs(2), 1, 0); sleep(500);
	plot2(dev.rafs(3), dev.rafs(4), 1, 0); sleep(500);
	
	plot2(dev.raf(5), dev.raf(6), 1, 0); sleep(500);
	
	plot2(dev.raf(7), dev.raf(8), 1, 0);
}
//------------------------------------------------------------

function w32(Address, Value)
{
	dev.w(Address,(Value & 0xffff));
	dev.w((Address + 1),((Value >> 16) & 0xffff));
}
//------------------------------------------------------------

function r32(Address)
{
	var ReadValue;
	
	ReadValue = dev.r(Address);
	ReadValue |= (dev.r(Address + 1) << 16);
	
	return ReadValue;
}
//--------------------