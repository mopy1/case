package com.casetool.backend.modules.xmi.service.lector;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockMultipartFile;
import org.w3c.dom.Document;

import com.casetool.backend.modules.xmi.service.XmiDom;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.AsociacionXmi;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi.ClaseXmi;

/**
 * Los 3 exports reales de Enterprise Architect del mismo diagrama (docente, grupo, materia, horario y la
 * clase asociación "tiene" entre grupo y horario) tienen que dar el mismo modelo, sea cual sea el formato.
 */
public class LectoresXmiEATest {

    private static final List<LectorXmi> LECTORES = List.of(new LectorXmiNativoEA(), new LectorXmiEA11(), new LectorXmiUml2());

    @ParameterizedTest
    @ValueSource(strings = { "ea-1.1.xmi", "ea-2.1.xmi", "ea-native.xmi" })
    void losTresFormatosDanElMismoModelo(String archivo) throws Exception {
        ModeloXmi modelo = leer(archivo);
        Map<String, ClaseXmi> porId = modelo.clases().stream().collect(Collectors.toMap(ClaseXmi::id, Function.identity()));
        Map<String, ClaseXmi> porNombre = modelo.clases().stream().collect(Collectors.toMap(ClaseXmi::nombre, Function.identity()));

        assertThat(porNombre).containsOnlyKeys("docente", "grupo", "materia", "horario", "tiene");
        assertThat(porNombre.get("horario").atributos()).extracting(ModeloXmi.AtributoXmi::nombre)
                .containsExactly("id", "dia", "hora inicio", "hora final");
        assertThat(porNombre.get("grupo").atributos().get(0).tipo()).isEqualToIgnoringCase("int");
        assertThat(modelo.clases()).allSatisfy(c -> assertThat(c.x()).isNotNull());
        assertThat(modelo.asociaciones()).hasSize(3);

        AsociacionXmi conClase = modelo.asociaciones().stream().filter(a -> a.claseAsociacionId() != null).findFirst().orElseThrow();
        assertThat(porId.get(conClase.claseAsociacionId()).nombre()).isEqualTo("tiene");
        assertThat(List.of(nombre(porId, conClase.origen()), nombre(porId, conClase.destino()))).containsExactly("grupo", "horario");

        AsociacionXmi docenteGrupo = buscar(modelo, porId, "docente", "grupo");
        assertThat(com.casetool.backend.modules.xmi.service.XmiMapeoEA.parsearMultiplicidad(docenteGrupo.destino().multiplicidad()).esUno()).isFalse();
        assertThat(com.casetool.backend.modules.xmi.service.XmiMapeoEA.parsearMultiplicidad(docenteGrupo.origen().multiplicidad()).esUno()).isFalse();
        AsociacionXmi grupoMateria = buscar(modelo, porId, "grupo", "materia");
        assertThat(com.casetool.backend.modules.xmi.service.XmiMapeoEA.parsearMultiplicidad(grupoMateria.destino().multiplicidad()).esUno()).isTrue();
    }

    private static AsociacionXmi buscar(ModeloXmi modelo, Map<String, ClaseXmi> porId, String origen, String destino) {
        return modelo.asociaciones().stream()
                .filter(a -> nombre(porId, a.origen()).equals(origen) && nombre(porId, a.destino()).equals(destino))
                .findFirst().orElseThrow();
    }

    private static String nombre(Map<String, ClaseXmi> porId, ModeloXmi.ExtremoXmi e) {
        return porId.get(e.claseId()).nombre();
    }

    public static ModeloXmi leer(String archivo) throws Exception {
        try (InputStream in = LectoresXmiEATest.class.getResourceAsStream("/xmi/" + archivo)) {
            Document doc = XmiDom.parsear(new MockMultipartFile("archivo", archivo, "application/xml", in.readAllBytes()));
            return LECTORES.stream().filter(l -> l.reconoce(doc)).findFirst().orElseThrow().leer(doc);
        }
    }
}
