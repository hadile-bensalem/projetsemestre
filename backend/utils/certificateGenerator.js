const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Génère un certificat PDF ultra-professionnel pour un étudiant qui a réussi un examen
 */
async function generateCertificate({ studentName, filiereName, examTitle, score, teacherName, date, submissionId }) {
    return new Promise((resolve, reject) => {
        try {
            // Créer le dossier certificates s'il n'existe pas
            const certDir = path.join(__dirname, '../certificates');
            if (!fs.existsSync(certDir)) {
                fs.mkdirSync(certDir, { recursive: true });
            }

            // Nom du fichier
            const fileName = `certificate_${submissionId}_${Date.now()}.pdf`;
            const filePath = path.join(certDir, fileName);

            // Créer le document PDF en format paysage A4
            const doc = new PDFDocument({
                size: 'A4',
                layout: 'landscape',
                margins: { top: 0, bottom: 0, left: 0, right: 0 }
            });

            // Pipe vers un fichier
            const stream = fs.createWriteStream(filePath);
            doc.pipe(stream);

            // Palette de couleurs ultra-professionnelles
            const royalGold = '#C9A961';        // Or royal élégant
            const deepNavy = '#0A1128';         // Bleu marine très profond
            const elegantBlue = '#1E3A8A';      // Bleu élégant
            const ivory = '#FFFFF0';            // Ivoire doux
            const crimson = '#8B0000';          // Rouge bordeaux pour accents
            const charcoal = '#2C2C2C';         // Charbon pour texte
            const softGold = '#F4E4C1';         // Or doux pour fond
            const accentGold = '#DAA520';       // Or accent brillant

            const pageWidth = doc.page.width;
            const pageHeight = doc.page.height;
            const margin = 50;

            // ============================================
            // FOND SOPHISTIQUÉ AVEC MOTIFS
            // ============================================
            
            // Fond principal ivoire
            doc.rect(0, 0, pageWidth, pageHeight)
                .fillColor(ivory)
                .fill();

            // Motif de fond subtil (lignes diagonales très légères)
            doc.save();
            doc.opacity(0.03);
            for (let i = 0; i < pageWidth; i += 30) {
                doc.strokeColor(royalGold)
                    .lineWidth(1)
                    .moveTo(i, 0)
                    .lineTo(i + pageHeight, pageHeight)
                    .stroke();
            }
            doc.restore();

            // Rectangle principal avec ombre portée simulée
            const mainRectMargin = margin + 5;
            doc.rect(mainRectMargin, mainRectMargin, 
                    pageWidth - 2 * mainRectMargin, 
                    pageHeight - 2 * mainRectMargin)
                .fillColor('#ffffff')
                .fill();

            // Bordure extérieure triple (effet luxe)
            // Bordure 1 : Or épais
            doc.strokeColor(royalGold)
                .lineWidth(8)
                .rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin)
                .stroke();

            // Bordure 2 : Bleu marine
            doc.strokeColor(deepNavy)
                .lineWidth(4)
                .rect(margin + 12, margin + 12, 
                      pageWidth - 2 * margin - 24, 
                      pageHeight - 2 * margin - 24)
                .stroke();

            // Bordure 3 : Or fin
            doc.strokeColor(accentGold)
                .lineWidth(2)
                .rect(margin + 20, margin + 20, 
                      pageWidth - 2 * margin - 40, 
                      pageHeight - 2 * margin - 40)
                .stroke();

            // Ornements d'angle sophistiqués
            const drawCornerOrnament = (x, y, rotation) => {
                doc.save();
                doc.translate(x, y);
                doc.rotate(rotation);
                
                // Motif floral stylisé
                doc.strokeColor(royalGold)
                    .lineWidth(2.5);
                
                // Feuille principale
                doc.moveTo(0, 0)
                    .bezierCurveTo(15, 5, 25, 15, 30, 30)
                    .stroke();
                
                doc.moveTo(0, 0)
                    .bezierCurveTo(5, 15, 15, 25, 30, 30)
                    .stroke();
                
                // Détails supplémentaires
                doc.moveTo(10, 10)
                    .bezierCurveTo(15, 12, 18, 18, 20, 25)
                    .stroke();
                
                doc.restore();
            };

            // Appliquer les ornements aux 4 coins
            drawCornerOrnament(margin + 35, margin + 35, 0);
            drawCornerOrnament(pageWidth - margin - 35, margin + 35, 90);
            drawCornerOrnament(pageWidth - margin - 35, pageHeight - margin - 35, 180);
            drawCornerOrnament(margin + 35, pageHeight - margin - 35, 270);

            // ============================================
            // BANDEAU SUPÉRIEUR DÉCORATIF
            // ============================================
            
            const bannerHeight = 100;
            const bannerY = margin + 50;
            
            // Bandeau avec dégradé simulé
            doc.rect(margin + 80, bannerY, pageWidth - 2 * margin - 160, bannerHeight)
                .fillColor(softGold)
                .fill()
                .strokeColor(royalGold)
                .lineWidth(3)
                .stroke();

            // Lignes décoratives dans le bandeau
            doc.strokeColor(accentGold)
                .lineWidth(1.5)
                .moveTo(margin + 90, bannerY + 10)
                .lineTo(pageWidth - margin - 90, bannerY + 10)
                .stroke();
            
            doc.moveTo(margin + 90, bannerY + bannerHeight - 10)
                .lineTo(pageWidth - margin - 90, bannerY + bannerHeight - 10)
                .stroke();

            // ============================================
            // MÉDAILLE DE RÉUSSITE ÉLÉGANTE
            // ============================================
            
            const medalRadius = 45;
            const medalX = pageWidth / 2;
            const medalY = bannerY + bannerHeight / 2;
            
            // Cercle extérieur or avec ombre
            doc.circle(medalX + 2, medalY + 2, medalRadius + 3)
                .fillColor('#00000020')
                .fill();
            
            // Cercle principal or
            doc.circle(medalX, medalY, medalRadius)
                .fillColor(royalGold)
                .fill();
            
            // Cercle intermédiaire marine
            doc.circle(medalX, medalY, medalRadius - 8)
                .fillColor(deepNavy)
                .fill();
            
            // Cercle intérieur blanc
            doc.circle(medalX, medalY, medalRadius - 13)
                .fillColor('#ffffff')
                .fill();
            
            // Étoile de réussite (dessin manuel)
            doc.save();
            doc.translate(medalX, medalY);
            doc.fillColor(royalGold);
            const starRadius = 18;
            const starPoints = 5;
            for (let i = 0; i < starPoints * 2; i++) {
                const radius = i % 2 === 0 ? starRadius : starRadius / 2;
                const angle = (Math.PI * i) / starPoints;
                const x = Math.cos(angle - Math.PI / 2) * radius;
                const y = Math.sin(angle - Math.PI / 2) * radius;
                if (i === 0) doc.moveTo(x, y);
                else doc.lineTo(x, y);
            }
            doc.fill();
            doc.restore();
            
            // Ruban décoratif sous la médaille
            doc.fillColor(crimson)
                .moveTo(medalX - 15, medalY + medalRadius - 5)
                .lineTo(medalX - 12, medalY + medalRadius + 35)
                .lineTo(medalX - 8, medalY + medalRadius + 30)
                .lineTo(medalX - 10, medalY + medalRadius - 5)
                .fill();
            
            doc.fillColor(crimson)
                .moveTo(medalX + 15, medalY + medalRadius - 5)
                .lineTo(medalX + 12, medalY + medalRadius + 35)
                .lineTo(medalX + 8, medalY + medalRadius + 30)
                .lineTo(medalX + 10, medalY + medalRadius - 5)
                .fill();

            // ============================================
            // TITRE PRINCIPAL MAJESTUEUX
            // ============================================
            
            const titleY = bannerY + bannerHeight + 40;
            
            // Titre "CERTIFICAT" avec effet d'ombre
            doc.fillColor('#00000015')
                .fontSize(52)
                .font('Helvetica-Bold')
                .text('CERTIFICAT', 2, titleY + 2, {
                    align: 'center',
                    width: pageWidth,
                    characterSpacing: 5
                });
            
            doc.fillColor(deepNavy)
                .fontSize(52)
                .font('Helvetica-Bold')
                .text('CERTIFICAT', 0, titleY, {
                    align: 'center',
                    width: pageWidth,
                    characterSpacing: 5
                });
            
            // Sous-titre "DE RÉUSSITE"
            doc.fillColor(royalGold)
                .fontSize(32)
                .font('Helvetica-Bold')
                .text('DE RÉUSSITE', 0, titleY + 50, {
                    align: 'center',
                    width: pageWidth,
                    characterSpacing: 3
                });

            // Ligne décorative ornementale
            const ornLineY = titleY + 95;
            const ornLineLength = 280;
            const ornLineX = (pageWidth - ornLineLength) / 2;
            
            // Ligne centrale
            doc.strokeColor(royalGold)
                .lineWidth(2)
                .moveTo(ornLineX, ornLineY)
                .lineTo(ornLineX + ornLineLength, ornLineY)
                .stroke();
            
            // Diamants décoratifs
            const drawDiamond = (x, y, size) => {
                doc.fillColor(royalGold)
                    .moveTo(x, y - size)
                    .lineTo(x + size, y)
                    .lineTo(x, y + size)
                    .lineTo(x - size, y)
                    .fill();
            };
            
            drawDiamond(ornLineX, ornLineY, 6);
            drawDiamond(pageWidth / 2, ornLineY, 8);
            drawDiamond(ornLineX + ornLineLength, ornLineY, 6);

            // Texte d'authentification
            doc.fillColor(charcoal)
                .fontSize(13)
                .font('Helvetica-Oblique')
                .text('Décerné par la Plateforme Éducative d\'Excellence', 
                      0, ornLineY + 20, {
                    align: 'center',
                    width: pageWidth
                });

            // ============================================
            // CORPS PRINCIPAL ÉLÉGANT
            // ============================================
            
            const bodyStartY = ornLineY + 65;
            
            // Texte d'introduction raffiné
            doc.fillColor(charcoal)
                .fontSize(18)
                .font('Helvetica')
                .text('Ce certificat atteste que', 0, bodyStartY, {
                    align: 'center',
                    width: pageWidth
                });

            // Nom de l'étudiant avec effet majestueux
            doc.fillColor('#00000012')
                .fontSize(42)
                .font('Helvetica-Bold')
                .text(studentName.toUpperCase(), 1, bodyStartY + 33, {
                    align: 'center',
                    width: pageWidth,
                    characterSpacing: 2
                });
            
            doc.fillColor(deepNavy)
                .fontSize(42)
                .font('Helvetica-Bold')
                .text(studentName.toUpperCase(), 0, bodyStartY + 32, {
                    align: 'center',
                    width: pageWidth,
                    characterSpacing: 2
                });

            // Double soulignement décoratif
            const underlineY = bodyStartY + 85;
            doc.strokeColor(royalGold)
                .lineWidth(3)
                .moveTo(pageWidth / 2 - 220, underlineY)
                .lineTo(pageWidth / 2 + 220, underlineY)
                .stroke();
            
            doc.strokeColor(accentGold)
                .lineWidth(1.5)
                .moveTo(pageWidth / 2 - 220, underlineY + 5)
                .lineTo(pageWidth / 2 + 220, underlineY + 5)
                .stroke();

            // Texte de félicitation
            doc.fillColor(charcoal)
                .fontSize(17)
                .font('Helvetica')
                .text('a brillamment réussi l\'examen', 0, underlineY + 25, {
                    align: 'center',
                    width: pageWidth
                });

            // Titre de l'examen dans un cadre élégant
            const examBoxY = underlineY + 58;
            const examBoxWidth = 500;
            const examBoxHeight = 60;
            const examBoxX = (pageWidth - examBoxWidth) / 2;
            
            // Fond du cadre
            doc.rect(examBoxX, examBoxY, examBoxWidth, examBoxHeight)
                .fillColor(softGold)
                .fill()
                .strokeColor(royalGold)
                .lineWidth(2)
                .stroke();
            
            // Titre de l'examen
            doc.fillColor(deepNavy)
                .fontSize(24)
                .font('Helvetica-Bold')
                .text(`« ${examTitle} »`, examBoxX + 20, examBoxY + 18, {
                    align: 'center',
                    width: examBoxWidth - 40
                });

            // ============================================
            // PANNEAU D'INFORMATIONS PRESTIGIEUX
            // ============================================
            
            const infoY = examBoxY + examBoxHeight + 25;
            const infoPanelWidth = 650;
            const infoPanelHeight = 120;
            const infoPanelX = (pageWidth - infoPanelWidth) / 2;
            
            // Cadre du panneau avec bordure dorée
            doc.rect(infoPanelX, infoY, infoPanelWidth, infoPanelHeight)
                .fillColor('#ffffff')
                .fill()
                .strokeColor(royalGold)
                .lineWidth(3)
                .stroke();
            
            // Bordure intérieure décorative
            doc.strokeColor(accentGold)
                .lineWidth(1)
                .rect(infoPanelX + 8, infoY + 8, 
                      infoPanelWidth - 16, infoPanelHeight - 16)
                .stroke();

            // Informations en grille élégante
            const infoStartY = infoY + 25;
            const col1X = infoPanelX + 50;
            const col2X = infoPanelX + infoPanelWidth / 2 + 30;
            const rowHeight = 28;

            // Filière
            doc.fillColor(royalGold)
                .fontSize(11)
                .font('Helvetica-Bold')
                .text('FILIÈRE', col1X, infoStartY);
            
            doc.fillColor(charcoal)
                .fontSize(14)
                .font('Helvetica')
                .text(filiereName, col1X, infoStartY + 14);

            // Note avec badge spécial
            doc.fillColor(royalGold)
                .fontSize(11)
                .font('Helvetica-Bold')
                .text('NOTE OBTENUE', col1X, infoStartY + rowHeight + 10);
            
            // Badge de note
            const scoreBoxX = col1X;
            const scoreBoxY = infoStartY + rowHeight + 26;
            doc.roundedRect(scoreBoxX, scoreBoxY, 80, 28, 5)
                .fillColor(deepNavy)
                .fill();
            
            doc.fillColor('#ffffff')
                .fontSize(18)
                .font('Helvetica-Bold')
                .text(`${score}%`, scoreBoxX + 5, scoreBoxY + 5, {
                    width: 70,
                    align: 'center'
                });

            // Enseignant
            doc.fillColor(royalGold)
                .fontSize(11)
                .font('Helvetica-Bold')
                .text('ENSEIGNANT', col2X, infoStartY);
            
            doc.fillColor(charcoal)
                .fontSize(14)
                .font('Helvetica')
                .text(teacherName, col2X, infoStartY + 14);

            // Date
            doc.fillColor(royalGold)
                .fontSize(11)
                .font('Helvetica-Bold')
                .text('DATE', col2X, infoStartY + rowHeight + 10);
            
            doc.fillColor(charcoal)
                .fontSize(14)
                .font('Helvetica')
                .text(date, col2X, infoStartY + rowHeight + 26);

            // ============================================
            // PIED DE PAGE AVEC SIGNATURES ÉLÉGANTES
            // ============================================
            
            const footerY = pageHeight - margin - 110;
            
            // Ligne de séparation ornementale
            const sepLineY = footerY - 15;
            doc.strokeColor(royalGold)
                .lineWidth(2)
                .moveTo(margin + 100, sepLineY)
                .lineTo(pageWidth / 2 - 80, sepLineY)
                .stroke();
            
            doc.strokeColor(royalGold)
                .lineWidth(2)
                .moveTo(pageWidth / 2 + 80, sepLineY)
                .lineTo(pageWidth - margin - 100, sepLineY)
                .stroke();
            
             // Ornement central (étoile simple)
             doc.fillColor(royalGold)
                 .fontSize(20)
                 .text('*', 0, sepLineY - 10, {
                     align: 'center',
                     width: pageWidth
                 });

            // Sceau officiel ultra-élégant
            const sealRadius = 50;
            const sealX = pageWidth / 2;
            const sealY = footerY + 35;
            
            // Ombre du sceau
            doc.circle(sealX + 3, sealY + 3, sealRadius)
                .fillColor('#00000020')
                .fill();
            
            // Cercle extérieur or
            doc.circle(sealX, sealY, sealRadius)
                .fillColor(royalGold)
                .fill();
            
            // Cercle bleu marine
            doc.circle(sealX, sealY, sealRadius - 7)
                .fillColor(deepNavy)
                .fill();
            
            // Cercle blanc central
            doc.circle(sealX, sealY, sealRadius - 14)
                .fillColor('#ffffff')
                .fill();
            
            // Texte du sceau
            doc.fillColor(deepNavy)
                .fontSize(12)
                .font('Helvetica-Bold')
                .text('CERTIFIÉ', sealX - 30, sealY - 18, {
                    align: 'center',
                    width: 60
                });
            
            doc.fontSize(10)
                .font('Helvetica')
                .text('OFFICIEL', sealX - 30, sealY, {
                    align: 'center',
                    width: 60
                });
            
            doc.fontSize(8)
                .text(new Date().getFullYear().toString(), sealX - 30, sealY + 15, {
                    align: 'center',
                    width: 60
                });

            // Zone de signature enseignant (gauche)
            const sigLeftX = margin + 120;
            const sigY = footerY + 30;
            const sigWidth = 180;
            
            doc.fillColor(charcoal)
                .fontSize(10)
                .font('Helvetica-Bold')
                .text('Signature de l\'enseignant', sigLeftX, sigY, {
                    width: sigWidth,
                    align: 'center'
                });
            
            // Ligne de signature élégante
            doc.strokeColor(royalGold)
                .lineWidth(2)
                .moveTo(sigLeftX, sigY + 35)
                .lineTo(sigLeftX + sigWidth, sigY + 35)
                .stroke();
            
            doc.fillColor(deepNavy)
                .fontSize(12)
                .font('Helvetica-Bold')
                .text(teacherName, sigLeftX, sigY + 42, {
                    width: sigWidth,
                    align: 'center'
                });

            // Date de délivrance (droite)
            const sigRightX = pageWidth - margin - 300;
            
            doc.fillColor(charcoal)
                .fontSize(10)
                .font('Helvetica-Bold')
                .text('Date de délivrance', sigRightX, sigY, {
                    width: sigWidth,
                    align: 'center'
                });
            
            doc.strokeColor(royalGold)
                .lineWidth(2)
                .moveTo(sigRightX, sigY + 35)
                .lineTo(sigRightX + sigWidth, sigY + 35)
                .stroke();
            
            doc.fillColor(deepNavy)
                .fontSize(12)
                .font('Helvetica-Bold')
                .text(date, sigRightX, sigY + 42, {
                    width: sigWidth,
                    align: 'center'
                });

            // ============================================
            // NUMÉRO DE CERTIFICAT ET AUTHENTIFICATION
            // ============================================
            
            const certNumber = `CERT-${submissionId.toString().substring(0, 8).toUpperCase()}-${Date.now().toString().substring(7, 13)}`;
            
            doc.fillColor('#a0a0a0')
                .fontSize(8)
                .font('Helvetica-Oblique')
                .text(`Numéro de certificat : ${certNumber}`, 
                      0, pageHeight - margin - 25, {
                    align: 'center',
                    width: pageWidth
                });
            
            doc.fillColor('#b0b0b0')
                .fontSize(7)
                .font('Helvetica-Oblique')
                .text('Ce certificat authentique est généré automatiquement et reste valide.', 
                      0, pageHeight - margin - 13, {
                    align: 'center',
                    width: pageWidth
                });

            // ============================================
            // FINALISATION
            // ============================================

            doc.end();

            stream.on('finish', () => {
                const relativePath = `/api/certificates/${fileName}`;
                console.log(' Certificat professionnel généré:', relativePath);
                resolve(relativePath);
            });

            stream.on('error', (error) => {
                console.error(' Erreur génération certificat:', error);
                reject(error);
            });

        } catch (error) {
            console.error(' Erreur création certificat:', error);
            reject(error);
        }
    });
}

module.exports = { generateCertificate };