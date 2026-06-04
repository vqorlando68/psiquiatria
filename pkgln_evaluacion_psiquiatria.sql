-- ==========================================================================
-- Script: pkgln_evaluacion_psiquiatria.sql
-- Descripcion: Tablas y paquete PL/SQL para la app de evaluacion psiquiatrica
-- Base de datos: Oracle
-- ==========================================================================

-- ─── SEQUENCES ─────────────────────────────────────────────────────────────

CREATE SEQUENCE tkr_evaluacion_seq
  START WITH 1
  INCREMENT BY 1
  NOCACHE
  NOCYCLE;

-- ─── TABLES ────────────────────────────────────────────────────────────────

CREATE TABLE tkr_evaluacion (
  id                NUMBER          NOT NULL,
  id_usuario        VARCHAR2(50)    NOT NULL, -- Evaluador (doctor)
  id_paciente       NUMBER          NOT NULL, -- Paciente evaluado (FK a tkr_usuarios)
  fecha_evaluacion  DATE            NOT NULL,
  motivo_consulta   CLOB,                     -- Se mantiene en BD por compatibilidad, se puede guardar NULL
  cie11_codigo      VARCHAR2(30),
  cie11_descripcion VARCHAR2(500),
  evaluacion_json   CLOB            NOT NULL, -- JSON completo de la evaluacion (escalas, examen mental, etc.)
  fecha_creacion    DATE            DEFAULT SYSDATE NOT NULL,
  fecha_modificacion DATE,
  activo            CHAR(1)         DEFAULT '1' NOT NULL,
  --
  CONSTRAINT PK_TKR_EVALUACION PRIMARY KEY (id),
  CONSTRAINT CK_TKR_EVAL_ACTIVO CHECK (activo IN ('0', '1'))
);

COMMENT ON TABLE tkr_evaluacion IS 'Evaluaciones psiquiátricas clínicas asociadas a pacientes';

-- ─── TRIGGERS ──────────────────────────────────────────────────────────────

CREATE OR REPLACE TRIGGER trg_bi_tkr_evaluacion
BEFORE INSERT ON tkr_evaluacion
FOR EACH ROW
BEGIN
  IF :NEW.id IS NULL THEN
    SELECT tkr_evaluacion_seq.NEXTVAL INTO :NEW.id FROM DUAL;
  END IF;
END;
/

-- ─── PACKAGE SPEC ──────────────────────────────────────────────────────────

CREATE OR REPLACE PACKAGE pkgln_evaluacion_psiquiatria AS

  -- -------------------------------------------------------------------------
  -- Inserta una nueva evaluación y devuelve el ID generado
  -- Recibe un JSON en p_json_entrada
  -- -------------------------------------------------------------------------
  PROCEDURE p_insertar_evaluacion (
    p_json_entrada      IN  CLOB,
    p_id                OUT NUMBER
  );

  -- -------------------------------------------------------------------------
  -- Actualiza una evaluación existente
  -- Recibe un JSON en p_json_entrada
  -- -------------------------------------------------------------------------
  PROCEDURE p_actualizar_evaluacion (
    p_json_entrada      IN  CLOB
  );

  -- -------------------------------------------------------------------------
  -- Borrado lógico de una evaluación
  -- Recibe un JSON en p_json_entrada
  -- -------------------------------------------------------------------------
  PROCEDURE p_eliminar_evaluacion (
    p_json_entrada      IN  CLOB
  );

  -- -------------------------------------------------------------------------
  -- Obtiene el JSON de una evaluación
  -- Recibe un JSON en p_json_entrada
  -- -------------------------------------------------------------------------
  FUNCTION f_obtener_evaluacion (
    p_json_entrada      IN  CLOB
  ) RETURN CLOB;

  -- -------------------------------------------------------------------------
  -- Devuelve un SYS_REFCURSOR con las evaluaciones de un usuario
  -- Recibe un JSON en p_json_entrada
  -- -------------------------------------------------------------------------
  FUNCTION f_listar_evaluaciones (
    p_json_entrada      IN  CLOB
  ) RETURN SYS_REFCURSOR;

END pkgln_evaluacion_psiquiatria;
/

-- ─── PACKAGE BODY ──────────────────────────────────────────────────────────

CREATE OR REPLACE PACKAGE BODY pkgln_evaluacion_psiquiatria AS

  -- -------------------------------------------------------------------------
  PROCEDURE p_insertar_evaluacion (
    p_json_entrada      IN  CLOB,
    p_id                OUT NUMBER
  ) IS
  BEGIN
    INSERT INTO tkr_evaluacion (
      id_usuario, id_paciente, fecha_evaluacion,
      motivo_consulta, cie11_codigo, cie11_descripcion,
      evaluacion_json, fecha_creacion, activo
    ) VALUES (
      JSON_VALUE(p_json_entrada, '$.id_usuario'),
      TO_NUMBER(JSON_VALUE(p_json_entrada, '$.id_paciente')),
      TO_DATE(JSON_VALUE(p_json_entrada, '$.fecha_evaluacion'), 'YYYY-MM-DD'),
      JSON_VALUE(p_json_entrada, '$.motivo_consulta'),
      JSON_VALUE(p_json_entrada, '$.cie11_codigo'),
      JSON_VALUE(p_json_entrada, '$.cie11_descripcion'),
      JSON_QUERY(p_json_entrada, '$.evaluacion_json' RETURNING CLOB),
      SYSDATE, '1'
    ) RETURNING id INTO p_id;

    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      RAISE;
  END p_insertar_evaluacion;

  -- -------------------------------------------------------------------------
  PROCEDURE p_actualizar_evaluacion (
    p_json_entrada      IN  CLOB
  ) IS
  BEGIN
    UPDATE tkr_evaluacion SET
      fecha_evaluacion   = NVL(TO_DATE(JSON_VALUE(p_json_entrada, '$.fecha_evaluacion'), 'YYYY-MM-DD'), fecha_evaluacion),
      motivo_consulta    = NVL(JSON_VALUE(p_json_entrada, '$.motivo_consulta'), motivo_consulta),
      cie11_codigo       = NVL(JSON_VALUE(p_json_entrada, '$.cie11_codigo'), cie11_codigo),
      cie11_descripcion  = NVL(JSON_VALUE(p_json_entrada, '$.cie11_descripcion'), cie11_descripcion),
      evaluacion_json    = NVL(JSON_QUERY(p_json_entrada, '$.evaluacion_json' RETURNING CLOB), evaluacion_json),
      fecha_modificacion = SYSDATE
    WHERE id         = TO_NUMBER(JSON_VALUE(p_json_entrada, '$.id'))
      AND id_usuario = JSON_VALUE(p_json_entrada, '$.id_usuario')
      AND activo     = '1';

    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      RAISE;
  END p_actualizar_evaluacion;

  -- -------------------------------------------------------------------------
  PROCEDURE p_eliminar_evaluacion (
    p_json_entrada      IN  CLOB
  ) IS
  BEGIN
    UPDATE tkr_evaluacion
       SET activo = '0', fecha_modificacion = SYSDATE
     WHERE id         = TO_NUMBER(JSON_VALUE(p_json_entrada, '$.id'))
       AND id_usuario = JSON_VALUE(p_json_entrada, '$.id_usuario');
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      RAISE;
  END p_eliminar_evaluacion;

  -- -------------------------------------------------------------------------
  FUNCTION f_obtener_evaluacion (
    p_json_entrada      IN  CLOB
  ) RETURN CLOB IS
    v_json CLOB;
  BEGIN
    SELECT evaluacion_json
      INTO v_json
      FROM tkr_evaluacion
     WHERE id         = TO_NUMBER(JSON_VALUE(p_json_entrada, '$.id'))
       AND id_usuario = JSON_VALUE(p_json_entrada, '$.id_usuario')
       AND activo     = '1';
    RETURN v_json;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RETURN NULL;
  END f_obtener_evaluacion;

  -- -------------------------------------------------------------------------
  FUNCTION f_listar_evaluaciones (
    p_json_entrada      IN  CLOB
  ) RETURN SYS_REFCURSOR IS
    v_cursor SYS_REFCURSOR;
  BEGIN
    OPEN v_cursor FOR
      SELECT e.id,
             u.nombres || ' ' || u.apellidos AS nombre_paciente,
             e.fecha_evaluacion,
             e.cie11_codigo,
             e.cie11_descripcion,
             e.id_usuario,
             e.fecha_creacion
        FROM tkr_evaluacion e
        JOIN tkr_usuarios u ON e.id_paciente = u.id
       WHERE e.id_usuario = JSON_VALUE(p_json_entrada, '$.id_usuario')
         AND e.activo     = '1'
       ORDER BY e.fecha_evaluacion DESC;
    RETURN v_cursor;
  END f_listar_evaluaciones;

END pkgln_evaluacion_psiquiatria;
/
