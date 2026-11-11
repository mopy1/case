package com.casetool.backend.modules.xmi.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicLong;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;

import com.casetool.backend.modules.diagrama.dto.AtributoEntidadRequest;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaRequest;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;
import com.casetool.backend.modules.diagrama.dto.RelacionDiagramaRequest;
import com.casetool.backend.modules.diagrama.service.AtributoEntidadService;
import com.casetool.backend.modules.diagrama.service.EntidadDiagramaService;
import com.casetool.backend.modules.diagrama.service.RelacionDiagramaService;
import com.casetool.backend.modules.xmi.service.lector.ModeloXmi;

/** Diagrama de prueba de EA: docente N:M grupo (genera intermedia), grupo N:1 materia y "tiene" como intermedia. */
class XmiMaterializadorTest {

    private final EntidadDiagramaService entidades = mock(EntidadDiagramaService.class);
    private final AtributoEntidadService atributos = mock(AtributoEntidadService.class);
    private final RelacionDiagramaService relaciones = mock(RelacionDiagramaService.class);
    private final Map<String, Long> idPorNombre = new HashMap<>();

    @ParameterizedTest
    @ValueSource(strings = { "ea-1.1.xmi", "ea-2.1.xmi", "ea-native.xmi" })
    void creaTablasIntermediasYClaves(String archivo) throws Exception {
        AtomicLong secuencia = new AtomicLong(1);
        when(entidades.crear(eq(1L), any(), eq(9L))).thenAnswer(inv -> {
            EntidadDiagramaRequest r = inv.getArgument(1);
            idPorNombre.put(r.nombre(), secuencia.get());
            return new EntidadDiagramaResponse(secuencia.getAndIncrement(), 1L, r.nombre(), r.posX(), r.posY(), List.of(), null);
        });
        ModeloXmi modelo = com.casetool.backend.modules.xmi.service.lector.LectoresXmiEATest.leer(archivo);
        new XmiMaterializador(new XmiCreadorEntidades(entidades), new XmiAtributosImport(atributos),
                new XmiRelacionesImport(relaciones)).materializar(1L, modelo, 9L, new HashMap<>());

        assertThat(idPorNombre).containsOnlyKeys("docente", "grupo", "materia", "horario", "tiene");
        Map<String, AtributoEntidadRequest> tiene = columnas(idPorNombre.get("tiene"));
        assertThat(tiene.get("idGrupo")).extracting(AtributoEntidadRequest::esPk, AtributoEntidadRequest::esFk,
                AtributoEntidadRequest::referenciaEntidadId).containsExactly(true, true, idPorNombre.get("grupo"));
        assertThat(tiene.get("idHorario").referenciaEntidadId()).isEqualTo(idPorNombre.get("horario"));
        assertThat(columnas(idPorNombre.get("docente")).get("codigo").esPk()).isTrue();
        assertThat(columnas(idPorNombre.get("horario")).get("id").tipoSql()).isEqualTo("INTEGER");

        // docente–grupo: N:M sin clase asociación → crear() genera la intermedia docente_grupo.
        verify(relaciones, times(1)).crear(eq(1L), any(), eq(9L));
        // grupo–materia + (N:M grupo–horario + grupo→tiene + horario→tiene).
        ArgumentCaptor<RelacionDiagramaRequest> sin = ArgumentCaptor.forClass(RelacionDiagramaRequest.class);
        verify(relaciones, times(4)).crearSinTablaIntermedia(eq(1L), sin.capture(), eq(9L));
        assertThat(sin.getAllValues()).filteredOn(r -> r.entidadDestinoId().equals(idPorNombre.get("tiene"))).hasSize(2);
    }

    private Map<String, AtributoEntidadRequest> columnas(Long entidadId) {
        ArgumentCaptor<AtributoEntidadRequest> captor = ArgumentCaptor.forClass(AtributoEntidadRequest.class);
        verify(atributos, org.mockito.Mockito.atLeast(0)).agregar(eq(entidadId), captor.capture(), eq(9L));
        Map<String, AtributoEntidadRequest> res = new HashMap<>();
        captor.getAllValues().forEach(a -> res.put(a.nombre(), a));
        return res;
    }
}
