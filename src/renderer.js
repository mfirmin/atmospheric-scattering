
import {
    BackSide,
    BufferAttribute,
    BufferGeometry,
    Mesh,
    MeshBasicMaterial,
    PerspectiveCamera,
    Scene,
    ShaderMaterial,
    SphereBufferGeometry,
    TextureLoader,
    Vector3,
    WebGLRenderer,
} from './lib/three.module';

export class Renderer {
    constructor(width, height) {
        try {
            this.renderer = new WebGLRenderer({
                alpha: true,
            });
        } catch (e) {
            throw new Error('Could not initialize WebGL');
        }
        this.timeEnabled = false;
        this.sunAngle = 1.57;

        this.sunSpeed = 3.14159 / 4000.0;
        this.mesh = null;
        this.sky = null;

        this.renderer.setClearColor(0x000000, 1);
        this.renderer.setSize(width, height);

        this.width = width;
        this.height = height;

        this.scene = new Scene();

        this.cameraMovementSpeed = 0.01;
        this.cameraLookSpeed = 0.01;

        this.createCamera();
        this.scene.add(this.camera);

        this.createSky();
    }

    updateCamera() {
        if (this.forward) {
            const dir = new Vector3().copy(this.cameraDirection);
            this.cameraPosition.add(dir.multiplyScalar(this.cameraMovementSpeed));
        }
        if (this.right) {
            const dir = new Vector3().crossVectors(this.cameraDirection, new Vector3(0, 1, 0));
            this.cameraPosition.add(dir.multiplyScalar(this.cameraMovementSpeed));
        }
        if (this.left) {
            const dir = new Vector3().crossVectors(this.cameraDirection, new Vector3(0, 1, 0));
            this.cameraPosition.add(dir.multiplyScalar(-this.cameraMovementSpeed));
        }
        if (this.back) {
            const dir = new Vector3().copy(this.cameraDirection);
            this.cameraPosition.add(dir.multiplyScalar(-this.cameraMovementSpeed));
        }


        const target = new Vector3().addVectors(this.cameraDirection, this.cameraPosition);

        this.camera.position.set(
            this.cameraPosition.x,
            this.cameraPosition.y,
            this.cameraPosition.z,
        );

        if (this.sky !== null) {
            this.sky.position.set(
                this.cameraPosition.x,
                this.cameraPosition.y,
                this.cameraPosition.z,
            );

            this.sky.material.uniforms.cameraAltitude.value = this.cameraPosition.y * 4000.0;
        }
        if (this.mesh !== null) {
            this.mesh.material.uniforms.cameraPos.value.set(
                this.cameraPosition.x,
                this.cameraPosition.y,
                this.cameraPosition.z,
            );
        }
        this.camera.lookAt(target.x, target.y, target.z);
    }

    createCamera() {
        this.camera = new PerspectiveCamera(45, this.width / this.height, 0.001, 1000.0);

        this.cameraPosition = new Vector3(-1, -0.05, 0);
        this.cameraDirection = new Vector3(1, 0, 0);

        this.updateCamera();

        let last = null;

        let ha = 0;
        let va = 0;

        const vLimit = 1.50;
        document.addEventListener('mousedown', (e) => {
            last = [e.pageX, e.pageY];
        });
        document.addEventListener('mousemove', (e) => {
            if (last !== null) {
                const delta = [e.pageX - last[0], e.pageY - last[1]];
                last = [e.pageX, e.pageY];

                ha += this.cameraLookSpeed * delta[0];
                va -= this.cameraLookSpeed * delta[1];
                if (va > vLimit) { va = vLimit; }
                if (va < -vLimit) { va = -vLimit; }

                this.cameraDirection.set(
                    Math.cos(ha) * Math.cos(va),
                    Math.sin(va),
                    Math.sin(ha) * Math.cos(va),
                );
            }
        });
        document.addEventListener('mouseup', () => {
            last = null;
        });

        this.forward = false;
        this.right = false;
        this.left = false;
        this.back = false;

        this.timeForward = false;
        this.timeBackward = false;
        document.addEventListener('keydown', (e) => {
            if (e.key === 'w') {
                this.forward = true;
            } else if (e.key === 'd') {
                this.right = true;
            } else if (e.key === 's') {
                this.back = true;
            } else if (e.key === 'a') {
                this.left = true;
            } else if (e.key === 'q') {
                this.timeBackward = true;
            } else if (e.key === 'e') {
                this.timeForward = true;
            }
        });
        document.addEventListener('keyup', (e) => {
            if (e.key === 'w') {
                this.forward = false;
            } else if (e.key === 'd') {
                this.right = false;
            } else if (e.key === 's') {
                this.back = false;
            } else if (e.key === 'a') {
                this.left = false;
            } else if (e.key === 'q') {
                this.timeBackward = false;
            } else if (e.key === 'e') {
                this.timeForward = false;
            } else if (e.key === '1') {
                this.sunAngle = 0.1;
            } else if (e.key === '2') {
                this.sunAngle = 0.7;
            } else if (e.key === '3') {
                this.sunAngle = 1.57;
            } else if (e.key === '4') {
                this.sunAngle = 2.6;
            } else if (e.key === '5') {
                this.sunAngle = 3.0;
            } else if (e.key === '6') {
                this.sunAngle = 3.12;
            } else if (e.key === ' ') {
                this.timeEnabled = !this.timeEnabled;
            } else if (e.key === 'r') {
                this.sky.material.uniforms.rayleigh.value =
                    +!this.sky.material.uniforms.rayleigh.value;

                this.mesh.material.uniforms.rayleigh.value =
                    +!this.mesh.material.uniforms.rayleigh.value;
            } else if (e.key === 'm') {
                this.sky.material.uniforms.mie.value =
                    +!this.sky.material.uniforms.mie.value;

                this.mesh.material.uniforms.mie.value =
                    +!this.mesh.material.uniforms.mie.value;
            }
        });
    }

    setSize(width, height) {
        this.width = width;
        this.height = height;

        this.renderer.setSize(width, height);
    }

    updateSun() {
        const sunX = Math.cos(this.sunAngle);
        const sunY = Math.sin(this.sunAngle);

        if (this.mesh !== null) {
            this.mesh.material.uniforms.sunDirection.value.set(sunX, sunY, 0);
            this.sky.material.uniforms.sunDirection.value.set(sunX, sunY, 0);
            this.sky.material.uniforms.exposure.value = sunY * 4;
            this.mesh.material.uniforms.exposure.value = Math.max(sunY * 4, 1);
        }
    }

    render(dt) {
        if (this.timeEnabled || this.timeForward) {
            this.sunAngle += dt * this.sunSpeed;
        } else if (this.timeBackward) {
            this.sunAngle -= dt * this.sunSpeed;
        }

        this.updateCamera();
        this.updateSun();
        this.renderer.render(this.scene, this.camera);
    }

    createShader() {
        const texture = new TextureLoader().load('/static/images/volcano_color.png');

        const shader = new ShaderMaterial({
            uniforms: {
                map: { type: 't', value: texture },
                sunDirection: { type: 'v3', value: new Vector3(0, 1, 0) },
                sunColor: { type: 'v3', value: new Vector3(20.0, 20.0, 20.0) },
                sunAmbientCoefficient: { type: 'f', value: 0.1 },

                earthRadius: { type: 'f', value: 6360000 },
                atmosphereRadius: { type: 'f', value: 6420000 },

                cameraPos: { type: 'v3', value: new Vector3(0, 0, 0) },

                exposure: { type: 'f', value: 1 },

                rayleigh: { type: 'f', value: 1 },
                mie: { type: 'f', value: 1 },
            },
            vertexShader: `
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec2 vUV;

                void main() {
                    vUV = uv;
                    vPosition = position;
                    vNormal = normal;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vPosition;
                varying vec3 vNormal;
                varying vec2 vUV;

                uniform sampler2D map;

                uniform vec3 sunDirection;
                uniform vec3 sunColor;
                uniform float sunAmbientCoefficient;

                uniform vec3 cameraPos;

                uniform float atmosphereRadius;
                uniform float earthRadius;

                uniform float exposure;

                uniform float rayleigh;
                uniform float mie;

                const int numSamples = 16;
                const int numSamplesLight = 16;

                const float Hr = 7994.0;
                const float Hm = 1200.0;

                const float g = 0.76;

                const float pi = 3.1415926535;
                const float twopi = 6.28318530718;
                const float halfpi = 1.57079632679;

                const vec3 betaR = vec3(5.8e-6, 13.5e-6, 33.1e-6);
                const vec3 betaM = vec3(21e-6);

                vec3 illuminate(vec3 inColor, vec3 lightColor, vec3 P, vec3 N, vec3 E) {
                    vec3 L = normalize(sunDirection);
                    float attenuation = 1.0;

                    vec3 ambient = sunAmbientCoefficient * inColor * sunColor * 0.05;

                    float diffuseCoefficient = max(0.0, dot(N, L));
                    vec3 diffuse = diffuseCoefficient * inColor * lightColor;

                    float specularCoefficient = 0.0;
                    vec3 specular = vec3(0.0);

                    vec3 outColor = ambient + attenuation * (diffuse + specular);

                    return outColor;
                }

                float raySphereIntersect(vec3 ro, vec3 rd, vec3 center, float radius) {
                    float A, B, C;
                    vec3 OC = ro - center;
                    C = dot(OC, OC) - radius * radius;
                    B = dot(OC * 2.0, rd);
                    A = dot(rd, rd);
                    float delta = B * B - 4.0 * A * C;

                    if (delta < 0.0) { return -1.0; }
                    else if (delta == 0.0) {
                        if (-B / (2.0 * A) < 0.0) {
                            return -1.0;
                        } else {
                            return -B / (2.0 * A);
                        }
                    } else {
                        float sqrtDelta = sqrt(delta);
                        float first = (-B + sqrtDelta) / (2.0 * A);
                        float second = (-B - sqrtDelta) / (2.0 * A);

                        if (first >= 0.0 && second >= 0.0) {
                            return first <= second ? first : second;
                        } else if (first < 0.0 && second < 0.0) {
                            return -1.0;
                        } else {
                            return first < 0.0 ? second : first;
                        }
                    }
                }

                vec3 computeAtmosphereColor(vec3 origin) {
                    vec3 positionModel = vec3(vPosition.x * 4000.0, earthRadius + vPosition.y * 4000.0, vPosition.z * 4000.0);
                    vec3 OM = positionModel - origin;
                    float distanceToModel = length(OM);
                    vec3 directionToModel = normalize(OM);
                    vec3 L = normalize(sunDirection);

                    float ds = distanceToModel / (float(numSamples));

                    float mu = dot(directionToModel, L);

                    float phaseR = 3.0 / (16.0 * pi) * (1.0 + mu * mu);
                    float phaseM = 3.0 / (8.0 * pi) * ((1.0 - g * g) * (1.0 + mu * mu)) / ((2.0 + g * g) * pow((1.0 + g * g - 2.0 * g * mu), 1.5));

                    // transmittance (aka optical depth) from view (V) to sample (S) (R)ayleigh and (M)ie
                    float TVSR = 0.0;
                    float TVSM = 0.0;

                    vec3 sumR = vec3(0.0);
                    vec3 sumM = vec3(0.0);

                    float tCurrent = 0.0;
                    for (int i = 0; i < numSamples; i++) {
                        vec3 samplePosition = origin + (tCurrent + ds * 0.5) * directionToModel;

                        float sampleHeight = length(samplePosition) - earthRadius;

                        float hr = exp(-sampleHeight / Hr) * ds;
                        float hm = exp(-sampleHeight / Hm) * ds;

                        TVSR += hr;
                        TVSM += hm;

                        // compute the ray from the sample to the atmosphere along the light direction

                        float t = raySphereIntersect(samplePosition, L, vec3(0.0, 0.0, 0.0), atmosphereRadius);
                        float dsl = t / (float(numSamplesLight));

                        // transmittance from sample to atmosphere along light ray
                        float TSAR = 0.0;
                        float TSAM = 0.0;

                        bool broken = false;
                        float tCurrentLight = 0.0;
                        for (int j = 0; j < numSamplesLight; ++j) {
                            vec3 samplePositionLight = samplePosition + (tCurrentLight + dsl * 0.5) * L;
                            float sampleHeightLight = length(samplePositionLight) - earthRadius;

                            // avoid looking inside the earth?
//                            if (sampleHeightLight < 0.0) { broken = true; break; }

                            TSAR += exp(-sampleHeightLight / Hr) * dsl;
                            TSAM += exp(-sampleHeightLight / Hm) * dsl;

                            tCurrentLight += dsl;
                        }

                        if (!broken) {
                            vec3 tau = betaR * (TVSR + TSAR) * rayleigh + betaM * 1.1 * (TVSM + TSAM) * mie;
                            vec3 attenuation = vec3(exp(-tau.r), exp(-tau.g), exp(-tau.b));

                            sumR += attenuation * hr;
                            sumM += attenuation * hm;
                        }

                        tCurrent += ds;
                    }

                    return vec3(sumR * betaR * phaseR * rayleigh + sumM * betaM * phaseM * mie) * sunColor;
                }

                void main() {
                    vec4 color = texture2D(map, vUV);

                    vec3 viewPosition = vec3(cameraPos.x * 4000.0, earthRadius + cameraPos.y * 4000.0, cameraPos.z * 4000.0);
                    vec3 atmosphereColor = computeAtmosphereColor(viewPosition);


                    vec3 N = normalize(vNormal);
                    color = vec4(illuminate(color.rgb, atmosphereColor, vPosition.xyz, N, cameraPos - vPosition), 1.0);

                    vec3 mappedColor = vec3(1.0) - exp(-color.rgb * exposure);

                    gl_FragColor = vec4(mappedColor, 1.0);
                }
            `,
        });

        return shader;
    }

    loadMesh(data) {
        const rawVertices = data.meshes[0].vertices;
        const rawNormals = data.meshes[0].normals;
        const rawFaces = data.meshes[0].faces;
        const rawUVs = data.meshes[0].texturecoords[0];

        const numFaces = rawFaces.length;
        const numVertices = numFaces * 3;

        const geom = new BufferGeometry();

        const vs = new Float32Array(numVertices * 3);
        const ns = new Float32Array(numVertices * 3);
        const uvs = new Float32Array(numVertices * 2);

        let y = 0;
        for (let i = 0; i < numFaces; i++) {
            const fa = rawFaces[i][0];
            const fb = rawFaces[i][1];
            const fc = rawFaces[i][2];

            const A = new Vector3(
                rawVertices[(fa * 3) + 0],
                rawVertices[(fa * 3) + 1],
                rawVertices[(fa * 3) + 2],
            );

            const B = new Vector3(
                rawVertices[(fb * 3) + 0],
                rawVertices[(fb * 3) + 1],
                rawVertices[(fb * 3) + 2],
            );

            const C = new Vector3(
                rawVertices[(fc * 3) + 0],
                rawVertices[(fc * 3) + 1],
                rawVertices[(fc * 3) + 2],
            );

            const AB = new Vector3().subVectors(B, A).normalize();
            const AC = new Vector3().subVectors(C, A).normalize();

            const N = new Vector3().crossVectors(AB, AC).normalize();

            vs[(i * 9) + 0] = A.x;
            vs[(i * 9) + 1] = A.y;
            vs[(i * 9) + 2] = A.z;

            vs[(i * 9) + 3] = B.x;
            vs[(i * 9) + 4] = B.y;
            vs[(i * 9) + 5] = B.z;

            vs[(i * 9) + 6] = C.x;
            vs[(i * 9) + 7] = C.y;
            vs[(i * 9) + 8] = C.z;

//            ns[(i * 9) + 0] = N.x;
//            ns[(i * 9) + 1] = N.y;
//            ns[(i * 9) + 2] = N.z;
//
//            ns[(i * 9) + 3] = N.x;
//            ns[(i * 9) + 4] = N.y;
//            ns[(i * 9) + 5] = N.z;
//
//            ns[(i * 9) + 6] = N.x;
//            ns[(i * 9) + 7] = N.y;
//            ns[(i * 9) + 8] = N.z;

            ns[(i * 9) + 0] = rawNormals[(fa * 3) + 0];
            ns[(i * 9) + 1] = rawNormals[(fa * 3) + 1];
            ns[(i * 9) + 2] = rawNormals[(fa * 3) + 2];

            ns[(i * 9) + 3] = rawNormals[(fb * 3) + 0];
            ns[(i * 9) + 4] = rawNormals[(fb * 3) + 1];
            ns[(i * 9) + 5] = rawNormals[(fb * 3) + 2];

            ns[(i * 9) + 6] = rawNormals[(fc * 3) + 0];
            ns[(i * 9) + 7] = rawNormals[(fc * 3) + 1];
            ns[(i * 9) + 8] = rawNormals[(fc * 3) + 2];

            uvs[(i * 6) + 0] = rawUVs[(fa * 2) + 0];
            uvs[(i * 6) + 1] = rawUVs[(fa * 2) + 1];

            uvs[(i * 6) + 2] = rawUVs[(fb * 2) + 0];
            uvs[(i * 6) + 3] = rawUVs[(fb * 2) + 1];

            uvs[(i * 6) + 4] = rawUVs[(fc * 2) + 0];
            uvs[(i * 6) + 5] = rawUVs[(fc * 2) + 1];
        }

        geom.addAttribute('position', new BufferAttribute(vs, 3));
        geom.addAttribute('normal', new BufferAttribute(ns, 3));
        geom.addAttribute('uv', new BufferAttribute(uvs, 2));

        const shader = this.createShader();
        const mesh = new Mesh(geom, shader);

        this.mesh = mesh;

        this.scene.add(mesh);
    }

    createSkyShader() {
        const shader = new ShaderMaterial({
            uniforms: {
                sunDirection: { type: 'v3', value: new Vector3(0, 1, 0) },
                sunColor: { type: 'v3', value: new Vector3(20.0, 20.0, 20.0) },
                sunAmbientCoefficient: { type: 'f', value: 0.2 },

                earthRadius: { type: 'f', value: 6360000 },
                atmosphereRadius: { type: 'f', value: 6420000 },

                cameraAltitude: { type: 'f', value: 1 },

                exposure: { type: 'f', value: 1 },

                rayleigh: { type: 'f', value: 1 },
                mie: { type: 'f', value: 1 },
            },
            vertexShader: `
                varying vec3 vDirection;
                varying vec3 vNormal;

                uniform float atmosphereRadius;

                void main() {
                    // map model position into "simulation" position
                    vDirection = normalize(position);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                varying vec3 vDirection;
                varying vec3 vNormal;

                uniform vec3 sunDirection;
                uniform vec3 sunColor;
                uniform float sunAmbientCoefficient;

                uniform float cameraAltitude;

                uniform float atmosphereRadius;
                uniform float earthRadius;

                uniform float exposure;

                uniform float rayleigh;
                uniform float mie;

                const int numSamples = 16;
                const int numSamplesLight = 8;

                const float Hr = 7994.0;
                const float Hm = 1200.0;

                const float g = 0.76;

                const float pi = 3.1415926535;
                const float twopi = 6.28318530718;
                const float halfpi = 1.57079632679;

                const vec3 betaR = vec3(5.8e-6, 13.5e-6, 33.1e-6);
                const vec3 betaM = vec3(21e-6);


                float raySphereIntersect(vec3 ro, vec3 rd, vec3 center, float radius) {
                    float A, B, C;
                    vec3 OC = ro - center;
                    C = dot(OC, OC) - radius * radius;
                    B = dot(OC * 2.0, rd);
                    A = dot(rd, rd);
                    float delta = B * B - 4.0 * A * C;

                    if (delta < 0.0) { return -1.0; }
                    else if (delta == 0.0) {
                        if (-B / (2.0 * A) < 0.0) {
                            return -1.0;
                        } else {
                            return -B / (2.0 * A);
                        }
                    } else {
                        float sqrtDelta = sqrt(delta);
                        float first = (-B + sqrtDelta) / (2.0 * A);
                        float second = (-B - sqrtDelta) / (2.0 * A);

                        if (first >= 0.0 && second >= 0.0) {
                            return first <= second ? first : second;
                        } else if (first < 0.0 && second < 0.0) {
                            return -1.0;
                        } else {
                            return first < 0.0 ? second : first;
                        }
                    }
                }

                vec3 computeAtmosphereColor(vec3 origin) {
                    float distanceToAtmosphere = raySphereIntersect(origin, normalize(vDirection), vec3(0.0, 0.0, 0.0), atmosphereRadius);
                    vec3 positionAtmosphere = origin + distanceToAtmosphere * vDirection;
                    vec3 OA = positionAtmosphere - origin;
                    vec3 directionToAtmosphere = normalize(vDirection);
                    vec3 L = normalize(sunDirection);

                    float ds = distanceToAtmosphere / (float(numSamples));

                    float mu = dot(directionToAtmosphere, L);

                    float phaseR = 3.0 / (16.0 * pi) * (1.0 + mu * mu);
                    float phaseM = 3.0 / (8.0 * pi) * ((1.0 - g * g) * (1.0 + mu * mu)) / ((2.0 + g * g) * pow((1.0 + g * g - 2.0 * g * mu), 1.5));

                    // transmittance (aka optical depth) from view (V) to sample (S) (R)ayleigh and (M)ie
                    float TVSR = 0.0;
                    float TVSM = 0.0;

                    vec3 sumR = vec3(0.0);
                    vec3 sumM = vec3(0.0);

                    float tCurrent = 0.0;
                    for (int i = 0; i < numSamples; i++) {
                        vec3 samplePosition = origin + (tCurrent + ds * 0.5) * directionToAtmosphere;

                        float sampleHeight = length(samplePosition) - earthRadius;

                        float hr = exp(-sampleHeight / Hr) * ds;
                        float hm = exp(-sampleHeight / Hm) * ds;

                        TVSR += hr;
                        TVSM += hm;

                        // compute the ray from the sample to the atmosphere along the light direction

                        float t = raySphereIntersect(samplePosition, L, vec3(0.0, 0.0, 0.0), atmosphereRadius);
                        float dsl = t / (float(numSamplesLight));

                        // transmittance from sample to atmosphere along light ray
                        float TSAR = 0.0;
                        float TSAM = 0.0;

                        bool broken = false;
                        float tCurrentLight = 0.0;
                        for (int j = 0; j < numSamplesLight; ++j) {
                            vec3 samplePositionLight = samplePosition + (tCurrentLight + dsl * 0.5) * L;
                            float sampleHeightLight = length(samplePositionLight) - earthRadius;

                            // avoid looking inside the earth?
                            if (sampleHeightLight < 0.0) { broken = true; break; }

                            TSAR += exp(-sampleHeightLight / Hr) * dsl;
                            TSAM += exp(-sampleHeightLight / Hm) * dsl;

                            tCurrentLight += dsl;
                        }

                        if (!broken) {
                            vec3 tau = rayleigh * betaR * (TVSR + TSAR) + mie * betaM * 1.1 * (TVSM + TSAM);
                            vec3 attenuation = vec3(exp(-tau.r), exp(-tau.g), exp(-tau.b));

                            sumR += attenuation * hr;
                            sumM += attenuation * hm;
                        }

                        tCurrent += ds;
                    }

                    return vec3(sumR * betaR * phaseR * rayleigh + sumM * betaM * phaseM * mie) * sunColor;
                }

                void main() {
                    vec3 viewPosition = vec3(0.0, earthRadius + cameraAltitude, 0.0);
                    vec3 atmosphereColor = computeAtmosphereColor(viewPosition);
                    vec3 mappedColor = vec3(1.0) - exp(-atmosphereColor * exposure);

                    gl_FragColor = vec4(mappedColor, 1.0);
                }
            `,
            side: BackSide,
        });

        return shader;
    }

    createSky() {
        const geom = new SphereBufferGeometry(500, 32, 32);
        const shader = this.createSkyShader();
        this.sky = new Mesh(geom, shader);

        this.scene.add(this.sky);
    }
}
