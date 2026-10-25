package com.casetool.backend.modules.diagrama.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.casetool.backend.modules.diagrama.dto.AtributoEntidadRequest;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaRequest;
import com.casetool.backend.modules.diagrama.dto.EntidadDiagramaResponse;
import com.casetool.backend.modules.diagrama.model.EntidadDiagrama;
import com.casetool.backend.modules.diagrama.model.RelacionDiagrama;
import com.casetool.backend.modules.diagrama.repository.RelacionDiagramaRepository;
import com.casetool.backend.modules.proyecto.model.Proyecto;

/**
 * Una relación N:M no existe como columna física en un esquema relacional real — se resuelve
 * con una tabla intermedia y dos FK 1:N. Se crea sola al elegir MUCHOS_A_MUCHOS para que el
 * modelo quede físicamente correcto de entrada: el generador de backend (Fase 4) necesita
 * columnas FK reales para armar `@ManyToOne`/`@JoinColumn`, no puede partir de un enum de
 * tipo de relación. La relación N:M elegida por el usuario se deja tal cual (documenta la
 * intención original en el lienzo); esto solo agrega su realización física al lado.
 * Lo usa {@link RelacionDiagramaService} al crear/editar una relación.
 */
@Service
@Transactional
public class TablaIntermediaService {

    private final RelacionDiagramaRepository relacionDiagramaRepository;
    private final EntidadDiagramaService entidadDiagramaService;
    private final AtributoEntidadService atributoEntidadService;

    public TablaIntermediaService(
            RelacionDiagramaRepository relacionDiagramaRepository,
            EntidadDiagramaService entidadDiagramaService,
            AtributoEntidadService atributoEntidadService) {
        this.relacionDiagramaRepository = relacionDiagramaRepository;
        this.entidadDiagramaService = entidadDiagramaService;
        this.atributoEntidadService = atributoEntidadService;
    }

    public void crearTablaIntermedia(
            Long proyectoId, Proyecto proyecto, EntidadDiagrama origen, EntidadDiagrama destino, Long usuarioId) {
        // N:M recursiva (origen y destino son la misma entidad, ej. "empleado" relacionado con
        // "empleado" — una red de contactos, no una jerarquía simple que sería 1:N). Sin este
        // caso aparte, las 2 columnas FK se llamarían igual ("empleado_id" las dos) y la segunda
        // `agregar()` de abajo rompería con un 409 de nombre duplicado.
        boolean esRecursiva = origen.getId().equals(destino.getId());
        String nombreBase = origen.getNombre() + "_" + destino.getNombre();
        String nombre = nombreBase;
        int sufijo = 2;
        while (entidadDiagramaService.existeNombre(proyectoId, nombre)) {
            nombre = nombreBase + "_" + sufijo++;
        }

        // Recursiva: si se centra en X igual que la tabla origen (como en el caso normal), la
        // tabla intermedia queda justo debajo del lazo de la relación recursiva — la línea de
        // "clase de asociación" termina pasando por arriba de la tabla origen para llegar. Se
        // corre al costado en vez de centrar para que quede libre.
        double posX = esRecursiva ? origen.getPosX() + 350 : (origen.getPosX() + destino.getPosX()) / 2;
        double posY = Math.max(origen.getPosY(), destino.getPosY()) + 220;

        EntidadDiagramaResponse tablaIntermedia = entidadDiagramaService.crear(
                proyectoId, new EntidadDiagramaRequest(nombre, posX, posY), usuarioId);

        String columnaOrigen = esRecursiva ? origen.getNombre() + "_origen_id" : origen.getNombre() + "_id";
        String columnaDestino = esRecursiva ? destino.getNombre() + "_destino_id" : destino.getNombre() + "_id";
        atributoEntidadService.agregar(tablaIntermedia.id(), new AtributoEntidadRequest(
                columnaOrigen, "BIGINT", true, true, origen.getId(), false), usuarioId);
        atributoEntidadService.agregar(tablaIntermedia.id(), new AtributoEntidadRequest(
                columnaDestino, "BIGINT", true, true, destino.getId(), false), usuarioId);

        EntidadDiagrama junction = entidadDiagramaService.buscarEntidad(tablaIntermedia.id());
        crearRelacionFisica(proyecto, origen, junction);
        crearRelacionFisica(proyecto, destino, junction);
    }

    private void crearRelacionFisica(Proyecto proyecto, EntidadDiagrama unLado, EntidadDiagrama junction) {
        RelacionDiagrama fisica = new RelacionDiagrama();
        fisica.setProyecto(proyecto);
        fisica.setEntidadOrigen(unLado);
        fisica.setEntidadDestino(junction);
        fisica.setMultiplicidadOrigen(RelacionDiagrama.Multiplicidad.UNO);
        fisica.setMultiplicidadDestino(RelacionDiagrama.Multiplicidad.UNO_O_MAS);
        relacionDiagramaRepository.save(fisica);
    }
}
