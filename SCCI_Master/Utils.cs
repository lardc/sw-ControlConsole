using System.Collections.Generic;

namespace PE.SCCI
{
    internal static class Utils
    {
        internal static void SerializeUShortArrayToBytes(IList<ushort> Source, int SourceLength, IList<byte> Destination,
                                                         int SourceOffset = 0, int DestinationOffset = 0)
        {
            for (var i = 0; i < SourceLength; ++i)
            {
                Destination[DestinationOffset + i * 2] = (byte)(Source[SourceOffset + i] >> 8);
                Destination[DestinationOffset + i * 2 + 1] = (byte)(Source[SourceOffset + i] & 0x00FF);
            }
        }

        internal static void DeserializeBytesToUShortArray(IList<byte> Source, int SourceLength, IList<ushort> Destination,
                                                          int SourceOffset = 0, int DestinationOffset = 0)
        {
            for (var i = 0; i < SourceLength / 2; ++i)
            {
                Destination[DestinationOffset + i] = (ushort)(Source[SourceOffset + i * 2] << 8);
                Destination[DestinationOffset + i] |= (ushort)(Source[SourceOffset + i * 2 + 1] & 0x00FF);
            }
        }

        internal static void DeserializeBytesToFloatArray(IList<byte> Source, int SourceLength, int SourceOffset,
                                                          IList<float> Destination)
        {
            byte[] SourceArray = new byte[Source.Count];
            Source.CopyTo(SourceArray, 0);

            for (var i = 0; i < SourceLength / 4; ++i)
            {
                var idx = SourceOffset + i * 4;

                // Flip bytes
                for (var j = 0; j <= 2; j += 2)
                {
                    byte tmp = SourceArray[idx + j];
                    SourceArray[idx + j] = SourceArray[idx + 1 + j];
                    SourceArray[idx + 1 + j] = tmp;
                }

                Destination.Add(System.BitConverter.ToSingle(SourceArray, idx));
            }
        }
    }
}
