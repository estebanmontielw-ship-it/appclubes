-- Migration: Torneo 3x3 — tablas de equipos y jugadores con seed
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tablas
CREATE TABLE IF NOT EXISTS "torneo3x3_equipos" (
  "id"            TEXT PRIMARY KEY,
  "nombre"        TEXT NOT NULL,
  "ciudad"        TEXT,
  "categoria"     TEXT NOT NULL,
  "emailContacto" TEXT,
  "telContacto"   TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "torneo3x3_jugadores" (
  "id"        TEXT PRIMARY KEY,
  "equipoId"  TEXT NOT NULL REFERENCES "torneo3x3_equipos"("id"),
  "nombre"    TEXT NOT NULL,
  "posicion"  INTEGER NOT NULL,
  "fechaNac"  TEXT,
  "nroCi"     TEXT,
  "celular"   TEXT,
  "camiseta"  TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Seed equipos Femenino Open
INSERT INTO "torneo3x3_equipos" ("id","nombre","ciudad","categoria","emailContacto","telContacto") VALUES
  ('f1','Team 361','Asunción','Femenino Open','paoferrari57@gmail.com','595982...'),
  ('f2','Flow Team','Asunción','Femenino Open','lopezagabii9@gmail.com','984920211'),
  ('f3','Dorado','Asunción','Femenino Open','pereirabelen2001@gmail.com','983922507'),
  ('f4','SJ','Caaguazú','Femenino Open','karincaceres764@gmail.com','982108356'),
  ('f5','Paraguay','Asunción','Femenino Open','duartermsol09@gmail.com','992846845'),
  ('f6','Full training','Asunción','Femenino Open','mapaumonta@gmail.com','985686500'),
  ('f7','roja pasión','Asunción','Femenino Open','sofi_gomez2008@hotmail.com','971565342'),
  ('f8','Maquinitas','Asunción','Femenino Open','manuramirezl02@gmail.com','595994...')
ON CONFLICT ("id") DO NOTHING;

-- 3. Seed jugadoras Femenino Open
INSERT INTO "torneo3x3_jugadores" ("id","equipoId","nombre","posicion") VALUES
  -- Team 361
  ('f1p1','f1','Peralta Ibarrola, Marta Gabriela',1),
  ('f1p2','f1','Ibarra Doldán, Ximena Jael',2),
  ('f1p3','f1','Schiavo Sena, Lucia',3),
  ('f1p4','f1','Ferrari Yegros, Paola Andrea',4),
  -- Flow Team
  ('f2p1','f2','Dose, Giulianna',1),
  ('f2p2','f2','Ochipinti, Agostina Maria',2),
  ('f2p3','f2','Villasboa Garcete, Dara Sofia',3),
  ('f2p4','f2','Lopez Ayala, Gabriela',4),
  -- Dorado
  ('f3p1','f3','Niz Velazquez, Paloma Maria',1),
  ('f3p2','f3','Ferreira, Bethsaida',2),
  ('f3p3','f3','Pereira Fleitas, María Belén',3),
  ('f3p4','f3','Aponte Lopez, Claudia Beatriz',4),
  -- SJ
  ('f4p1','f4','Caceres, Karin',1),
  ('f4p2','f4','Gimenez, Kenya',2),
  ('f4p3','f4','Ortiz Lopez, Paulina',3),
  ('f4p4','f4','Ovelar, Sady',4),
  -- Paraguay
  ('f5p1','f5','Dragotto, Maria',1),
  ('f5p2','f5','Bernal Ortellado, Gabriela',2),
  ('f5p3','f5','Duarte, Gilda',3),
  ('f5p4','f5','Ocampo Cabral, Sol Valeria',4),
  -- Full training
  ('f6p1','f6','Cáceres Alvarenga, Cecilia Belen',1),
  ('f6p2','f6','Gimenez, Micaela',2),
  ('f6p3','f6','Montañez, María Paula',3),
  ('f6p4','f6','Mineiro Pegoraro, Agatha',4),
  -- roja pasión
  ('f7p1','f7','Viedma, Agustina',1),
  ('f7p2','f7','Temperley, Stephanie',2),
  ('f7p3','f7','Arce, Mischa',3),
  ('f7p4','f7','Agüero, Cecilia',4),
  -- Maquinitas
  ('f8p1','f8','Velázquez Tucci, Ana Paula',1),
  ('f8p2','f8','Benitez, Jael',2),
  ('f8p3','f8','Cardenas, Adela',3),
  ('f8p4','f8','Ramírez, Manuela',4)
ON CONFLICT ("id") DO NOTHING;

-- 4. Seed equipos Masculino Open
INSERT INTO "torneo3x3_equipos" ("id","nombre","ciudad","categoria","emailContacto","telContacto") VALUES
  ('m1','Inter BO Azul','Ñemby','Masculino Open','dermeister1987.cc@gmail.com','+595 972 457000'),
  ('m2','God time','Asunción','Masculino Open','josemarti.jm@icloud.com','595987...'),
  ('m3','SGN','Rio de Janeiro','Masculino Open','ellianlacerda@icloud.com','595991...'),
  ('m4','B.E.M.P','San Lorenzo','Masculino Open','matiasayalagarcia20@gmail.com','985207126'),
  ('m5','Tiger k','Itauguá','Masculino Open','isaiastroche7700@gmail.com','991209589'),
  ('m6','SANIG WARRIORS','Ayolas','Masculino Open','matiasestigarribiaromero4@gmail.com','973185204'),
  ('m7','JK Basketball','Asunción','Masculino Open','jeferson.arguello00@gmail.com','975820643'),
  ('m8','Cerro Porteño','Asunción','Masculino Open','carlos@likepro.com.py','595983...'),
  ('m9','3x3 Paseo','Asunción','Masculino Open','gprietoyprietoabogados@gmail.com','991848382'),
  ('m10','Street JK','Asunción','Masculino Open','jeferson.arguello00@gmail.com','975820643'),
  ('m11','3x3 Itaugua','Itauguá','Masculino Open','isaiastroche7700@gmail.com','974851837'),
  ('m12','Pana u19','Asunción','Masculino Open',NULL,NULL),
  ('m13','INTER BO.','Asunción','Masculino Open','dermeister1987.cc@gmail.com','972457000'),
  ('m14','Parque Caballero','Asunción','Masculino Open','lukscoronel@hotmail.com','983447964'),
  ('m15','Snipers','Asunción','Masculino Open','carlosdp24@gmail.com','972779572'),
  ('m16','Nexus','Asunción','Masculino Open','enzorenefernandez11@gmail.com','981453406'),
  ('m17','RED ZONE','Asunción','Masculino Open','tateti2007@hotmail.com','994354673'),
  ('m18','3x3 No Mercy','Asunción','Masculino Open','mendietaguillermo7@gmail.com','595982...'),
  ('m19','Champions Academy','San Lorenzo','Masculino Open','edurivas.coach@gmail.com','961606101'),
  ('m20','Deportivo Amambay','Pedro Juan Caballero','Masculino Open','Pauloreich1986@gmail.com','595972...')
ON CONFLICT ("id") DO NOTHING;

-- 5. Seed jugadores Masculino Open
INSERT INTO "torneo3x3_jugadores" ("id","equipoId","nombre","posicion") VALUES
  -- Inter BO Azul
  ('m1p1','m1','Lopez, Mario',1),
  ('m1p2','m1','Saifildin, Alan',2),
  ('m1p3','m1','Arce, Benjamin',3),
  ('m1p4','m1','Sosa, Luis',4),
  -- God time
  ('m2p1','m2','Galarza, Joaquin',1),
  ('m2p2','m2','Martí, José',2),
  ('m2p3','m2','Gonzalez, Samuel',3),
  ('m2p4','m2','Arrua, Fabrizio',4),
  -- SGN
  ('m3p1','m3','Santana Eliziairo, Matheus',1),
  ('m3p2','m3','Lacerda, Ellian',2),
  ('m3p3','m3','Rodrigues, Ruan',3),
  ('m3p4','m3','Moreira Matos Júnior, George',4),
  -- B.E.M.P
  ('m4p1','m4','Ayala, Matias',1),
  ('m4p2','m4','Piris, Diego',2),
  ('m4p3','m4','Espinola, Hernan Brian',3),
  ('m4p4','m4','Gómez Galeano, Miguel Adrián',4),
  -- Tiger k
  ('m5p1','m5','Ramirez, Matias',1),
  ('m5p2','m5','Centurion Colman, Sebastian Daniel',2),
  ('m5p3','m5','Vera y Aragón Villamayor, Carlos Alexander',3),
  ('m5p4','m5','López Rivas, Miguel Jesús',4),
  -- SANIG WARRIORS
  ('m6p1','m6','Montiel, Ivan',1),
  ('m6p2','m6','Báez Armoa, Fernando',2),
  ('m6p3','m6','Aquino, Felix',3),
  ('m6p4','m6','Estigarribia Romero, Matias De Jesús',4),
  -- JK Basketball (sin jugadores registrados, poner placeholder)
  ('m7p1','m7','Jugador 1 (sin registrar)',1),
  ('m7p2','m7','Jugador 2 (sin registrar)',2),
  ('m7p3','m7','Jugador 3 (sin registrar)',3),
  -- Cerro Porteño
  ('m8p1','m8','Jara Salomón, Daniel Agustín',1),
  ('m8p2','m8','Toro, Oscar',2),
  ('m8p3','m8','Recalde, Jonathan',3),
  ('m8p4','m8','Peralta Barreto, Nelson',4),
  -- 3x3 Paseo
  ('m9p1','m9','Quesnel, Ricardo',1),
  ('m9p2','m9','Aguilera, Sebastian',2),
  ('m9p3','m9','Prieto, Gonzalo',3),
  ('m9p4','m9','Arca Pereira, Fabrizio',4),
  -- Street JK
  ('m10p1','m10','Arguello, Jeferson',1),
  ('m10p2','m10','Jugador 2 (sin registrar)',2),
  ('m10p3','m10','Jugador 3 (sin registrar)',3),
  -- 3x3 Itaugua
  ('m11p1','m11','Fleitas, Isaac',1),
  ('m11p2','m11','Ibanez Vega, Jose Antonio',2),
  ('m11p3','m11','Troche, Isaias',3),
  ('m11p4','m11','Gavilan, Jose',4),
  -- Pana u19
  ('m12p1','m12','Escurra Arriola, Mauricio',1),
  ('m12p2','m12','Negrette Zacarias, Alexis Agustin',2),
  ('m12p3','m12','Talavera, Alejandro',3),
  ('m12p4','m12','Ortiz, Guillermo',4),
  -- INTER BO.
  ('m13p1','m13','Scala, Nahuel',1),
  ('m13p2','m13','Martí González, Juan Manuel',2),
  ('m13p3','m13','Acosta Flores, Alejandro',3),
  ('m13p4','m13','Bogarin, Francisco',4),
  -- Parque Caballero
  ('m14p1','m14','Rodriguez, Tobias',1),
  ('m14p2','m14','Coronel Orzusa, Lucas Matias',2),
  ('m14p3','m14','Ayala Paez, Diego',3),
  ('m14p4','m14','Guanes, Roberto',4),
  -- Snipers (3 jugadores)
  ('m15p1','m15','Marti Gonzalez, Jesus Manuel',1),
  ('m15p2','m15','Del Puerto, Carlos',2),
  ('m15p3','m15','Araujo Cappello, Guillermo Alejandro',3),
  -- Nexus
  ('m16p1','m16','Fernández, Enzo',1),
  ('m16p2','m16','Giménez González, Marcos Aurelio',2),
  ('m16p3','m16','Benítez, Facundo',3),
  ('m16p4','m16','Aguirre, Jesus',4),
  -- RED ZONE
  ('m17p1','m17','González, Lionel',1),
  ('m17p2','m17','Paniagua, José',2),
  ('m17p3','m17','Quevedo, Joel',3),
  ('m17p4','m17','Tiecher, Joel',4),
  -- 3x3 No Mercy
  ('m18p1','m18','Mendieta, Guillermo',1),
  ('m18p2','m18','Fernández, Alejandro',2),
  ('m18p3','m18','Ramirez, Benja',3),
  ('m18p4','m18','Ezequiel, Alexis',4),
  -- Champions Academy
  ('m19p1','m19','Rivera, Darwin',1),
  ('m19p2','m19','Rivas, Eduardo',2),
  ('m19p3','m19','Peralta, Santiago',3),
  ('m19p4','m19','Lopez Fariña, Adolfo Miguel',4),
  -- Deportivo Amambay (3 jugadores)
  ('m20p1','m20','Bazan Barreto, Victor Alexandre',1),
  ('m20p2','m20','Loreiro, Mariano',2),
  ('m20p3','m20','Duarte, Tobias',3)
ON CONFLICT ("id") DO NOTHING;
