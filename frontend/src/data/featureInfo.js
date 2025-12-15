// src/data/featureInfo.js

export const FEATURE_INFO = {
  // CICIDS features
  "Protocol": "Transport layer protocol. 6 = TCP, 17 = UDP.",
  "Dst Port": "Destination port number of the network flow.",
  "Flow Duration": "Total duration of the flow in seconds.",
  "Tot Fwd Pkts": "Total number of packets sent forward.",
  "Tot Bwd Pkts": "Total number of packets sent backward.",
  "TotLen Fwd Pkts": "Total bytes sent forward.",
  "TotLen Bwd Pkts": "Total bytes sent backward.",
  "Fwd Pkt Len Mean": "Mean length of forward packets.",
  "Bwd Pkt Len Mean": "Mean length of backward packets.",
  "Flow IAT Mean": "Mean inter-arrival time between packets.",
  "Fwd PSH Flags": "Number of TCP PUSH flags (PSH).",
  "Fwd URG Flags": "Number of TCP URG flags (urgent).",
  "Fwd IAT Mean": "Mean inter-arrival time of forward packets.",

  // BCC features
  "proto": "Network protocol. 6 = TCP, 17 = UDP.",
  "src_port": "Source port of the traffic flow.",
  "dst_port": "Destination port of the traffic flow.",
  "flow_duration": "Duration of the observed flow.",
  "total_fwd_pkts": "Packets flowed forward.",
  "total_bwd_pkts": "Packets flowed backward.",
  "flags_numeric": "TCP flag combination encoded numerically.",
  "payload_len": "Payload bytes in flow.",
  "header_len": "Header bytes in flow.",
  "rate": "Data throughput rate (bytes/sec).",
  "iat": "Inter-arrival time between packets.",
  "syn": "Count of SYN flags.",
  "ack": "Count of ACK flags.",
  "rst": "Count of RST flags.",
  "fin": "Count of FIN flags."
};
