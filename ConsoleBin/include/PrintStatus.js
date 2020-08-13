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

function PrintFWInfo()
{
	// Check connection
	dev.r(0);
	
	try
	{
		dev.Read16Silent(256);
		
		print("");
		print("Slave CAN ID:	" + dev.r(256));
		print("Master CAN ID:	" + dev.r(257));
		
		var StrLen = dev.r(260);
		var Str = '';
		for (var i = 0; i < StrLen / 2; i++)
		{
			var Word = dev.r(261 + i);
			Str.concat(String.fromCharCode(Word >> 8));
			Str.concat(String.fromCharCode(Word & 0xFF));
		}
		
		print(Str);
	}
	catch(e)
	{
		print("No firmware information.");
	}
}
