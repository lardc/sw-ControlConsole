function PrintStatus()
{
	// Check connection
	dev.r(0);
	
	try
	{
		dev.Read16Silent(192);
		
		print("Registers [192 - 196]");
		print("Device state:	" + dev.r(192));
		print("Fault reason:	" + dev.r(193));
		print("Disable reason:	" + dev.r(194));
		print("Warning:	" + dev.r(195));
		print("Problem:	" + dev.r(196));
		print("Q-Correction:	" + dev.r(254));
	}
	catch(e)
	{
		print("Registers [96 - 100]");
		print("Device state:	" + dev.r(96));
		print("Fault reason:	" + dev.r(97));
		print("Disable reason:	" + dev.r(98));
		print("Warning:	" + dev.r(99));
		print("Problem:	" + dev.r(100));
	}
}
