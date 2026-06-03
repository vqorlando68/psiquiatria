-- ==========================================================================
-- Script: pkgln_evaluacion_psiquiatria.sql
-- Descripcion: Tablas y paquete PL/SQL para la app de evaluacion psiquiatrica
-- Base de datos: Oracle
-- ==========================================================================

-- ─── SEQUENCES ─────────────────────────────────────────────────────────────

CREATE SEQUENCE PSIQ_EVALUACION_SEQ
  START WITH 1
  INCREMENT BY 1
  NOCACHE
  NOCYCLE;

CREATE SEQUENCE PSIQ_ESCALA_SEQ
  START WITH 1
  INCREMENT BY 1
  NOCACHE
  NOCYCLE;

CREATE SEQUENCE PSIQ_MSE_SEQ
  START WITH 1
  INCREMENT BY 1
  NOCACHE
  NOCYCLE;

-- ─── TABLES ────────────────────────────────────────────────────────────────

CREATE TABLE PSIQ_EVALUACION (
  ID_EVALUACION     NUMBER          NOT NULL,
  ID_USUARIO        VARCHAR2(50)    NOT NULL,
  FECHA_EVALUACION  DATE            NOT NULL,
  -- Demografía
  NOMBRE_PACIENTE   VARCHAR2(200)   NOT NULL,
  FECHA_NACIMIENTO  DATE,
  SEXO              CHAR(1),            -- M/F/O
  ESCOLARIDAD       VARCHAR2(100),
  OCUPACION         VARCHAR2(200),
  ESTADO_CIVIL      VARCHAR2(50),
  MOTIVO_CONSULTA   CLOB,
  -- Diagnóstico
  CIE11_CODIGO      VARCHAR2(30),
  CIE11_DESCRIPCION VARCHAR2(500),
  -- JSON completo de la evaluación
  EVALUACION_JSON   CLOB,
  -- Auditoría
  FECHA_CREACION    DATE            DEFAULT SYSDATE NOT NULL,
  FECHA_MODIFICACION DATE,
  ACTIVO            CHAR(1)         DEFAULT '1' NOT NULL,
  --
  CONSTRAINT PK_PSIQ_EVALUACION PRIMARY KEY (ID_EVALUACION),
  CONSTRAINT CK_PSIQ_EVAL_SEXO   CHECK (SEXO IN ('M', 'F', 'O')),
  CONSTRAINT CK_PSIQ_EVAL_ACTIVO CHECK (ACTIVO IN ('0', '1'))
);

COMMENT ON TABLE  PSIQ_EVALUACION              IS 'Evaluaciones psiquiátricas clínicas';
COMMENT ON COLUMN PSIQ_EVALUACION.EVALUACION_JSON IS 'JSON completo de la evaluacion incluyendo escalas y MSE';

-- ─── PACKAGE SPEC ──────────────────────────────────────────────────────────

CREATE OR REPLACE PACKAGE pkgln_evaluacion_psiquiatria AS

  -- -------------------------------------------------------------------------
  -- Inserta una nueva evaluación y devuelve el ID generado
  -- -------------------------------------------------------------------------
  PROCEDURE p_insertar_evaluacion (
    p_id_usuario        IN  PSIQ_EVALUACION.ID_USUARIO%TYPE,
    p_nombre_paciente   IN  PSIQ_EVALUACION.NOMBRE_PACIENTE%TYPE,
    p_fecha_evaluacion  IN  PSIQ_EVALUACION.FECHA_EVALUACION%TYPE,
    p_fecha_nacimiento  IN  PSIQ_EVALUACION.FECHA_NACIMIENTO%TYPE  DEFAULT NULL,
    p_sexo              IN  PSIQ_EVALUACION.SEXO%TYPE              DEFAULT NULL,
    p_escolaridad       IN  PSIQ_EVALUACION.ESCOLARIDAD%TYPE        DEFAULT NULL,
    p_ocupacion         IN  PSIQ_EVALUACION.OCUPACION%TYPE          DEFAULT NULL,
    p_estado_civil      IN  PSIQ_EVALUACION.ESTADO_CIVIL%TYPE       DEFAULT NULL,
    p_motivo_consulta   IN  CLOB                                    DEFAULT NULL,
    p_cie11_codigo      IN  PSIQ_EVALUACION.CIE11_CODIGO%TYPE       DEFAULT NULL,
    p_cie11_descripcion IN  PSIQ_EVALUACION.CIE11_DESCRIPCION%TYPE  DEFAULT NULL,
    p_evaluacion_json   IN  CLOB                                    DEFAULT NULL,
    p_id_evaluacion     OUT PSIQ_EVALUACION.ID_EVALUACION%TYPE
  );

  -- -------------------------------------------------------------------------
  -- Actualiza una evaluación existente
  -- -------------------------------------------------------------------------
  PROCEDURE p_actualizar_evaluacion (
    p_id_evaluacion     IN  PSIQ_EVALUACION.ID_EVALUACION%TYPE,
    p_id_usuario        IN  PSIQ_EVALUACION.ID_USUARIO%TYPE,
    p_nombre_paciente   IN  PSIQ_EVALUACION.NOMBRE_PACIENTE%TYPE   DEFAULT NULL,
    p_fecha_evaluacion  IN  PSIQ_EVALUACION.FECHA_EVALUACION%TYPE  DEFAULT NULL,
    p_fecha_nacimiento  IN  PSIQ_EVALUACION.FECHA_NACIMIENTO%TYPE  DEFAULT NULL,
    p_sexo              IN  PSIQ_EVALUACION.SEXO%TYPE              DEFAULT NULL,
    p_escolaridad       IN  PSIQ_EVALUACION.ESCOLARIDAD%TYPE        DEFAULT NULL,
    p_ocupacion         IN  PSIQ_EVALUACION.OCUPACION%TYPE          DEFAULT NULL,
    p_estado_civil      IN  PSIQ_EVALUACION.ESTADO_CIVIL%TYPE       DEFAULT NULL,
    p_motivo_consulta   IN  CLOB                                    DEFAULT NULL,
    p_cie11_codigo      IN  PSIQ_EVALUACION.CIE11_CODIGO%TYPE       DEFAULT NULL,
    p_cie11_descripcion IN  PSIQ_EVALUACION.CIE11_DESCRIPCION%TYPE  DEFAULT NULL,
    p_evaluacion_json   IN  CLOB                                    DEFAULT NULL
  );

  -- -------------------------------------------------------------------------
  -- Borrado lógico de una evaluación
  -- -------------------------------------------------------------------------
  PROCEDURE p_eliminar_evaluacion (
    p_id_evaluacion IN PSIQ_EVALUACION.ID_EVALUACION%TYPE,
    p_id_usuario    IN PSIQ_EVALUACION.ID_USUARIO%TYPE
  );

  -- -------------------------------------------------------------------------
  -- Obtiene el JSON de una evaluación
  -- -------------------------------------------------------------------------
  FUNCTION f_obtener_evaluacion (
    p_id_evaluacion IN PSIQ_EVALUACION.ID_EVALUACION%TYPE,
    p_id_usuario    IN PSIQ_EVALUACION.ID_USUARIO%TYPE
  ) RETURN CLOB;

  -- -------------------------------------------------------------------------
  -- Devuelve un SYS_REFCURSOR con las evaluaciones de un usuario
  -- -------------------------------------------------------------------------
  FUNCTION f_listar_evaluaciones (
    p_id_usuario IN PSIQ_EVALUACION.ID_USUARIO%TYPE
  ) RETURN SYS_REFCURSOR;

END pkgln_evaluacion_psiquiatria;
/

-- ─── PACKAGE BODY ──────────────────────────────────────────────────────────

CREATE OR REPLACE PACKAGE BODY pkgln_evaluacion_psiquiatria AS

  -- -------------------------------------------------------------------------
  PROCEDURE p_insertar_evaluacion (
    p_id_usuario        IN  PSIQ_EVALUACION.ID_USUARIO%TYPE,
    p_nombre_paciente   IN  PSIQ_EVALUACION.NOMBRE_PACIENTE%TYPE,
    p_fecha_evaluacion  IN  PSIQ_EVALUACION.FECHA_EVALUACION%TYPE,
    p_fecha_nacimiento  IN  PSIQ_EVALUACION.FECHA_NACIMIENTO%TYPE  DEFAULT NULL,
    p_sexo              IN  PSIQ_EVALUACION.SEXO%TYPE              DEFAULT NULL,
    p_escolaridad       IN  PSIQ_EVALUACION.ESCOLARIDAD%TYPE        DEFAULT NULL,
    p_ocupacion         IN  PSIQ_EVALUACION.OCUPACION%TYPE          DEFAULT NULL,
    p_estado_civil      IN  PSIQ_EVALUACION.ESTADO_CIVIL%TYPE       DEFAULT NULL,
    p_motivo_consulta   IN  CLOB                                    DEFAULT NULL,
    p_cie11_codigo      IN  PSIQ_EVALUACION.CIE11_CODIGO%TYPE       DEFAULT NULL,
    p_cie11_descripcion IN  PSIQ_EVALUACION.CIE11_DESCRIPCION%TYPE  DEFAULT NULL,
    p_evaluacion_json   IN  CLOB                                    DEFAULT NULL,
    p_id_evaluacion     OUT PSIQ_EVALUACION.ID_EVALUACION%TYPE
  ) IS
    v_id PSIQ_EVALUACION.ID_EVALUACION%TYPE;
  BEGIN
    SELECT PSIQ_EVALUACION_SEQ.NEXTVAL INTO v_id FROM DUAL;

    INSERT INTO PSIQ_EVALUACION (
      ID_EVALUACION, ID_USUARIO, FECHA_EVALUACION,
      NOMBRE_PACIENTE, FECHA_NACIMIENTO, SEXO,
      ESCOLARIDAD, OCUPACION, ESTADO_CIVIL,
      MOTIVO_CONSULTA, CIE11_CODIGO, CIE11_DESCRIPCION,
      EVALUACION_JSON, FECHA_CREACION, ACTIVO
    ) VALUES (
      v_id, p_id_usuario, p_fecha_evaluacion,
      p_nombre_paciente, p_fecha_nacimiento, p_sexo,
      p_escolaridad, p_ocupacion, p_estado_civil,
      p_motivo_consulta, p_cie11_codigo, p_cie11_descripcion,
      p_evaluacion_json, SYSDATE, '1'
    );

    COMMIT;
    p_id_evaluacion := v_id;

  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      RAISE;
  END p_insertar_evaluacion;

  -- -------------------------------------------------------------------------
  PROCEDURE p_actualizar_evaluacion (
    p_id_evaluacion     IN  PSIQ_EVALUACION.ID_EVALUACION%TYPE,
    p_id_usuario        IN  PSIQ_EVALUACION.ID_USUARIO%TYPE,
    p_nombre_paciente   IN  PSIQ_EVALUACION.NOMBRE_PACIENTE%TYPE   DEFAULT NULL,
    p_fecha_evaluacion  IN  PSIQ_EVALUACION.FECHA_EVALUACION%TYPE  DEFAULT NULL,
    p_fecha_nacimiento  IN  PSIQ_EVALUACION.FECHA_NACIMIENTO%TYPE  DEFAULT NULL,
    p_sexo              IN  PSIQ_EVALUACION.SEXO%TYPE              DEFAULT NULL,
    p_escolaridad       IN  PSIQ_EVALUACION.ESCOLARIDAD%TYPE        DEFAULT NULL,
    p_ocupacion         IN  PSIQ_EVALUACION.OCUPACION%TYPE          DEFAULT NULL,
    p_estado_civil      IN  PSIQ_EVALUACION.ESTADO_CIVIL%TYPE       DEFAULT NULL,
    p_motivo_consulta   IN  CLOB                                    DEFAULT NULL,
    p_cie11_codigo      IN  PSIQ_EVALUACION.CIE11_CODIGO%TYPE       DEFAULT NULL,
    p_cie11_descripcion IN  PSIQ_EVALUACION.CIE11_DESCRIPCION%TYPE  DEFAULT NULL,
    p_evaluacion_json   IN  CLOB                                    DEFAULT NULL
  ) IS
  BEGIN
    UPDATE PSIQ_EVALUACION SET
      NOMBRE_PACIENTE    = NVL(p_nombre_paciente,   NOMBRE_PACIENTE),
      FECHA_EVALUACION   = NVL(p_fecha_evaluacion,  FECHA_EVALUACION),
      FECHA_NACIMIENTO   = NVL(p_fecha_nacimiento,  FECHA_NACIMIENTO),
      SEXO               = NVL(p_sexo,              SEXO),
      ESCOLARIDAD        = NVL(p_escolaridad,        ESCOLARIDAD),
      OCUPACION          = NVL(p_ocupacion,          OCUPACION),
      ESTADO_CIVIL       = NVL(p_estado_civil,       ESTADO_CIVIL),
      MOTIVO_CONSULTA    = NVL(p_motivo_consulta,    MOTIVO_CONSULTA),
      CIE11_CODIGO       = NVL(p_cie11_codigo,       CIE11_CODIGO),
      CIE11_DESCRIPCION  = NVL(p_cie11_descripcion,  CIE11_DESCRIPCION),
      EVALUACION_JSON    = NVL(p_evaluacion_json,    EVALUACION_JSON),
      FECHA_MODIFICACION = SYSDATE
    WHERE ID_EVALUACION = p_id_evaluacion
      AND ID_USUARIO    = p_id_usuario
      AND ACTIVO        = '1';

    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      RAISE;
  END p_actualizar_evaluacion;

  -- -------------------------------------------------------------------------
  PROCEDURE p_eliminar_evaluacion (
    p_id_evaluacion IN PSIQ_EVALUACION.ID_EVALUACION%TYPE,
    p_id_usuario    IN PSIQ_EVALUACION.ID_USUARIO%TYPE
  ) IS
  BEGIN
    UPDATE PSIQ_EVALUACION
      SET ACTIVO = '0', FECHA_MODIFICACION = SYSDATE
    WHERE ID_EVALUACION = p_id_evaluacion
      AND ID_USUARIO    = p_id_usuario;
    COMMIT;
  EXCEPTION
    WHEN OTHERS THEN
      ROLLBACK;
      RAISE;
  END p_eliminar_evaluacion;

  -- -------------------------------------------------------------------------
  FUNCTION f_obtener_evaluacion (
    p_id_evaluacion IN PSIQ_EVALUACION.ID_EVALUACION%TYPE,
    p_id_usuario    IN PSIQ_EVALUACION.ID_USUARIO%TYPE
  ) RETURN CLOB IS
    v_json CLOB;
  BEGIN
    SELECT EVALUACION_JSON
      INTO v_json
      FROM PSIQ_EVALUACION
     WHERE ID_EVALUACION = p_id_evaluacion
       AND ID_USUARIO    = p_id_usuario
       AND ACTIVO        = '1';
    RETURN v_json;
  EXCEPTION
    WHEN NO_DATA_FOUND THEN
      RETURN NULL;
  END f_obtener_evaluacion;

  -- -------------------------------------------------------------------------
  FUNCTION f_listar_evaluaciones (
    p_id_usuario IN PSIQ_EVALUACION.ID_USUARIO%TYPE
  ) RETURN SYS_REFCURSOR IS
    v_cursor SYS_REFCURSOR;
  BEGIN
    OPEN v_cursor FOR
      SELECT ID_EVALUACION,
             NOMBRE_PACIENTE,
             FECHA_EVALUACION,
             CIE11_CODIGO,
             CIE11_DESCRIPCION,
             ID_USUARIO,
             FECHA_CREACION
        FROM PSIQ_EVALUACION
       WHERE ID_USUARIO = p_id_usuario
         AND ACTIVO     = '1'
       ORDER BY FECHA_EVALUACION DESC;
    RETURN v_cursor;
  END f_listar_evaluaciones;

END pkgln_evaluacion_psiquiatria;
/

-- ─── GRANTS (adjust schema as needed) ─────────────────────────────────────
-- GRANT EXECUTE ON pkgln_evaluacion_psiquiatria TO TEKER_DEV;
