import pandas as pd
from scapy.all import rdpcap

def convert_pcap_to_csv(input_pcap):
    packets = rdpcap(input_pcap)
    data = []

    for pkt in packets:
        try:
            row = {
                "src_port": pkt.sport if hasattr(pkt, "sport") else 0,
                "dst_port": pkt.dport if hasattr(pkt, "dport") else 0,
                "proto": pkt.proto if hasattr(pkt, "proto") else 0,
                "payload_len": len(pkt.payload)
            }
            data.append(row)
        except:
            pass

    df = pd.DataFrame(data)
    out_csv = input_pcap + ".csv"
    df.to_csv(out_csv, index=False)
    return out_csv
