function w32(Address, Value)
{
	dev.w(Address, (Value & 0xffff));
	dev.w((Address + 1), (Value >> 16) & 0xffff);
}
//--------------------

function r32(Address)
{
	return dev.r(Address) | (dev.r(Address + 1) << 16);
}
//--------------------
