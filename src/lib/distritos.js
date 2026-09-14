// Ninguna API pública del Congreso entrega hoy el distrito (los campos existen en los WSDL pero vienen vacíos).
// Asignación de electos 2026-2030 por distrito según «LVII periodo legislativo del Congreso Nacional de Chile»
// (es.wikipedia.org, consultado 2026-09-11), cruzada por nombre con los IDs de opendata.camara.cl
// y validada contra los escaños por distrito de la Ley 20.840 (155 en total). Revisar si hay reemplazos.
export const DIPUTADOS_POR_DISTRITO = {
  1:[1141,1208,1216],
  2:[1195,1215,1231],
  3:[986,1099,1182,1187,1239],
  4:[872,1073,1175,1236,1254],
  5:[1117,1142,1174,1177,1212,1250,1255],
  6:[1060,1104,1107,1181,1211,1221,1224,1235],
  7:[1015,1021,1122,1170,1176,1189,1259,1263],
  8:[1165,1188,1190,1200,1210,1217,1234,1256],
  9:[1012,1065,1146,1205,1243,1247,1260],
  10:[1009,1086,1127,1171,1213,1218,1223,1237],
  11:[1025,1075,1100,1214,1227,1252],
  12:[1017,1039,1059,1128,1173,1240,1251],
  13:[1028,1087,1159,1191,1248],
  14:[1044,1074,1133,1186,1199,1262],
  15:[1077,1166,1207,1253,1264],
  16:[1114,1203,1206,1233],
  17:[915,1132,1150,1184,1196,1229,1258],
  18:[1180,1194,1225,1242],
  19:[1116,1119,1143,1197,1204],
  20:[815,1054,1102,1157,1193,1198,1238,1246],
  21:[1062,1082,1183,1192,1241],
  22:[1061,1108,1152,1202],
  23:[843,1153,1172,1201,1219,1226,1232],
  24:[1038,1209,1220,1249,1261],
  25:[1056,1105,1140,1228],
  26:[1013,1131,1178,1230,1244],
  27:[803,1222,1257],
  28:[1110,1148,1245],
};
export const DISTRITOS = new Map(Object.entries(DIPUTADOS_POR_DISTRITO).flatMap(([distrito,ids])=>ids.map(id=>[id,Number(distrito)])));
