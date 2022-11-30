include("Tektronix.js");
include("TestQRRHP.js")
include("Sic_GetData.js")

// CAN Nomber
CAN = 5;
QSU  = 10;
DCU1 = 160;
DCU2 = 161;

// Calibration setup parameters
cal_Rshunt = 1000;	// uOhm
cal_Points = 10;
cal_Iterations = 1;
cal_UseAvg = 1;

// CurrentArray
cal_IdMin = 200;	
cal_IdMax = 2200;
cal_IdStp = 0;

// VoltageRete
cal_IntPsVmin = 80;	// V
cal_IntPsVmax = 120;

//CurrentRate
CurrentRateNTest = 0;
CurrentRateN = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
CurrentRate1 = [0.167, 0.25, 0.334, 0.834, 1.667, 2.5, 3.334, 5, 8.334, 10, 16.667]; // in A/us 1, 1.5, 2, 5, 10, 15, 20, 30, 50, 60, 100
CurrentRate2 = [0.334, 0.5, 0.668, 1.667, 3.334, 5, 6.668, 10, 16.667, 20, 33.334]; // in A/us 1, 1.5, 2, 5, 10, 15, 20, 30, 50, 60, 100



function CAL_Init(portDevice, portTek, channelMeasureI, channelMeasureU)
{
	if (channelMeasureI < 1 || channelMeasureU > 4)
	{
		print("Wrong channel numbers");
		return;
	}

	// Copy channel information
	cal_chMeasureI = channelMeasureI;
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


function ALL_DCU_SW() 
{

 	dev.co(CAN);
 	dev.nid(DCU1);
 	dev.c(1); 
 	dev.nid(DCU2);
 	dev.c(1);	

} 

//--------------------

function ALL_DCU_Pulse(Current, CurrentRate)
{

	dev.nid(DCU1);
	dev.w(128, Current);
	dev.w(129, CurrentRate);
	if(dev.r(192) == 3)
		{

		dev.c(100);

		}
	dev.nid(DCU2);
	dev.w(128, Current);
	dev.w(129, CurrentRate);
	if(dev.r(192) == 3)
		{

		dev.c(100);
		
		}
	dev.nid(QSU);
	sleep(200);
	dev.c(22);


}