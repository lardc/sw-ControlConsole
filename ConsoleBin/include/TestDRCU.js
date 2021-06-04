include("PrintStatus.js")

CurrentRateArray = [50, 75, 100, 250, 500, 750, 1000, 1500, 2500, 3000, 5000]; // A/us * 100
CurrentTest = 400;	// A

function DRCU_Debug(Current, Range)
{
	dev.w(150, Range);
	dev.c(59);
	dev.w(150, Current);
	dev.w(151, Current);
	dev.c(60);
}

function DRCU_Pulse(Current, CurrentRate)
{
	dev.w(128, Current);
	dev.w(129, CurrentRate);
	
	if(dev.r(192) == 3)
	{
		dev.c(100);
		
		while(dev.r(192) != 4)
		{
			if(dev.r(192) == 1)
			{
				PrintStatus();
				return 0;
			}
		}
		
		dev.c(101);
		sleep(50);
		
		while(dev.r(192) != 3)
		{
			if(dev.r(192) == 1)
			{
				PrintStatus();
				return 0;
			}
		}
	}
	else
		PrintStatus();
	
	return 1;
}
//---------------------------------------------

function DRCU_Test(N)
{
	for (var i = 0; i < N; i++)
	{
		for (var j = 0; j < 11; j++)
		{
			p("#" + (i * 11 + j));
			p("dI/dt = " + CurrentRateArray[j] / 100 + "A/us")
			p("----------------");
			p("");
			
			if(!DRCU_Pulse(CurrentTest, CurrentRateArray[j]))
				return;
			
			if (anykey())
				return;
		}
	}
}

function DRCU_InPsVoltageSet(CurrentRate, Voltage)
{
	switch(CurrentRate * 100)
	{
		case 50:
			dev.w(52, Voltage * 10);
			break;
		case 75:
			dev.w(53, Voltage * 10);
			break;
		case 100:
			dev.w(54, Voltage * 10);
			break;
		case 250:
			dev.w(55, Voltage * 10);
			break;
		case 500:
			dev.w(56, Voltage * 10);
			break;
		case 750:
			dev.w(57, Voltage * 10);
			break;
		case 1000:
			dev.w(58, Voltage * 10);
			break;
		case 1500:
			dev.w(59, Voltage * 10);
			break;
		case 2500:
			dev.w(60, Voltage * 10);
			break;
		case 3000:
			dev.w(61, Voltage * 10);
			break;
		case 5000:
			dev.w(62, Voltage * 10);
			break;
	}
}
//---------------------------------------------
