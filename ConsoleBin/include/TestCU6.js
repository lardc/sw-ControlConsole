include("PrintStatus.js")

function CU_SetPin(PinID, Action, ResetMode)
{
	// clear all pins
	if (ResetMode != 0)
	{
		dev.w(67, 0);
		for (i = 0; i < 3; i++)
		{
			dev.w(66, i);
			dev.c(101);
		}
		dev.c(102);
		sleep(500);
	}
	
	// set pin
	dev.w(64, PinID);
	dev.w(65, Action);
	dev.c(100);
	dev.c(102);
}

function CU6_GTU ( TYPES, POS, CASES )
{
dev.w(70,TYPES);
dev.w(71,POS);
dev.w(72,CASES);
dev.c(121);
}

function CU6_GTUSL ( TYPES, POS, CASES )
{
dev.w(70,TYPES);
dev.w(71,POS);
dev.w(72,CASES);
dev.c(126);
}