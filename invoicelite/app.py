from flask import Flask, render_template, request, jsonify, send_file
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
import json
import os
from datetime import datetime
import io

app = Flask(__name__)

# In-memory storage (replace with database in production)
invoices = []
clients = []
invoice_counter = 1

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/clients', methods=['GET', 'POST'])
def handle_clients():
    global clients
    
    if request.method == 'POST':
        client_data = request.json
        client = {
            'id': len(clients) + 1,
            'name': client_data['name'],
            'email': client_data['email'],
            'address': client_data['address'],
            'phone': client_data.get('phone', ''),
            'created_at': datetime.now().isoformat()
        }
        clients.append(client)
        return jsonify(client), 201
    
    return jsonify(clients)

@app.route('/api/invoices', methods=['GET', 'POST'])
def handle_invoices():
    global invoices, invoice_counter
    
    if request.method == 'POST':
        invoice_data = request.json
        
        # Calculate totals
        subtotal = sum(float(item['quantity']) * float(item['rate']) for item in invoice_data['items'])
        tax_amount = subtotal * (float(invoice_data.get('tax_rate', 0)) / 100)
        total = subtotal + tax_amount
        
        invoice = {
            'id': invoice_counter,
            'invoice_number': f'INV-{invoice_counter:04d}',
            'client_id': invoice_data['client_id'],
            'client_name': invoice_data['client_name'],
            'date': invoice_data['date'],
            'due_date': invoice_data['due_date'],
            'items': invoice_data['items'],
            'subtotal': round(subtotal, 2),
            'tax_rate': float(invoice_data.get('tax_rate', 0)),
            'tax_amount': round(tax_amount, 2),
            'total': round(total, 2),
            'notes': invoice_data.get('notes', ''),
            'status': 'draft',
            'created_at': datetime.now().isoformat()
        }
        
        invoices.append(invoice)
        invoice_counter += 1
        return jsonify(invoice), 201
    
    return jsonify(invoices)

@app.route('/api/invoices/<int:invoice_id>/pdf')
def generate_pdf(invoice_id):
    invoice = next((inv for inv in invoices if inv['id'] == invoice_id), None)
    if not invoice:
        return jsonify({'error': 'Invoice not found'}), 404
    
    # Create PDF in memory
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=1*inch)
    
    # Get styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=colors.HexColor('#667eea')
    )
    
    # Build PDF content
    story = []
    
    # Header
    story.append(Paragraph("INVOICE", title_style))
    story.append(Spacer(1, 20))
    
    # Invoice details
    invoice_info = [
        ['Invoice Number:', invoice['invoice_number']],
        ['Date:', invoice['date']],
        ['Due Date:', invoice['due_date']],
        ['Client:', invoice['client_name']]
    ]
    
    info_table = Table(invoice_info, colWidths=[2*inch, 3*inch])
    info_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
    ]))
    
    story.append(info_table)
    story.append(Spacer(1, 30))
    
    # Items table
    items_data = [['Description', 'Quantity', 'Rate', 'Amount']]
    for item in invoice['items']:
        amount = float(item['quantity']) * float(item['rate'])
        items_data.append([
            item['description'],
            str(item['quantity']),
            f"${float(item['rate']):.2f}",
            f"${amount:.2f}"
        ])
    
    items_table = Table(items_data, colWidths=[3*inch, 1*inch, 1*inch, 1*inch])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#667eea')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    story.append(items_table)
    story.append(Spacer(1, 20))
    
    # Totals
    totals_data = [
        ['Subtotal:', f"${invoice['subtotal']:.2f}"],
        [f"Tax ({invoice['tax_rate']}%):", f"${invoice['tax_amount']:.2f}"],
        ['Total:', f"${invoice['total']:.2f}"]
    ]
    
    totals_table = Table(totals_data, colWidths=[4*inch, 2*inch])
    totals_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
    ]))
    
    story.append(totals_table)
    
    # Notes
    if invoice['notes']:
        story.append(Spacer(1, 30))
        story.append(Paragraph("Notes:", styles['Heading3']))
        story.append(Paragraph(invoice['notes'], styles['Normal']))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f"{invoice['invoice_number']}.pdf",
        mimetype='application/pdf'
    )

@app.route('/api/analytics')
def analytics():
    total_invoices = len(invoices)
    total_revenue = sum(inv['total'] for inv in invoices)
    avg_invoice = total_revenue / total_invoices if total_invoices > 0 else 0
    
    # Monthly data
    monthly_data = {}
    for invoice in invoices:
        month = invoice['date'][:7]  # YYYY-MM
        if month not in monthly_data:
            monthly_data[month] = {'count': 0, 'revenue': 0}
        monthly_data[month]['count'] += 1
        monthly_data[month]['revenue'] += invoice['total']
    
    return jsonify({
        'total_invoices': total_invoices,
        'total_revenue': round(total_revenue, 2),
        'average_invoice': round(avg_invoice, 2),
        'monthly_data': monthly_data
    })

if __name__ == '__main__':
    app.run(debug=True)